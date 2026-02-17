-- ============================================================
-- PetSocial - Friend Requests + Stories Migration (IDEMPOTENTE)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PARTE 1: SOLICITUDES DE AMISTAD (Follow Requests)
-- ============================================================

-- Agregar columna status a follows (pending | accepted)
-- Los follows existentes quedan como 'accepted'
ALTER TABLE follows ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);

-- Actualizar trigger de conteo: solo contar follows 'accepted'
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Solo incrementar si el follow es aceptado
    IF NEW.status = 'accepted' THEN
      UPDATE pets SET following_count = following_count + 1 WHERE id = NEW.follower_id;
      UPDATE pets SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambia de pending a accepted, incrementar contadores
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      UPDATE pets SET following_count = following_count + 1 WHERE id = NEW.follower_id;
      UPDATE pets SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Solo decrementar si el follow era aceptado
    IF OLD.status = 'accepted' THEN
      UPDATE pets SET following_count = following_count - 1 WHERE id = OLD.follower_id;
      UPDATE pets SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger para incluir UPDATE
DROP TRIGGER IF EXISTS trg_follow_counts ON follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR UPDATE OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Actualizar RLS: el receptor puede hacer UPDATE para aceptar/rechazar
DROP POLICY IF EXISTS "follows_update_receiver" ON follows;
CREATE POLICY "follows_update_receiver"
  ON follows FOR UPDATE
  USING (is_pet_owner(following_id))
  WITH CHECK (is_pet_owner(following_id));

-- ============================================================
-- PARTE 2: HISTORIAS (Stories) - 24 horas
-- ============================================================

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_pet ON stories(pet_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, pet_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_pet ON story_views(pet_id);

-- RLS para stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories: cualquiera puede ver historias no expiradas
DROP POLICY IF EXISTS "stories_select_active" ON stories;
CREATE POLICY "stories_select_active"
  ON stories FOR SELECT
  USING (expires_at > NOW());

-- Stories: solo el dueño puede crear
DROP POLICY IF EXISTS "stories_insert_owner" ON stories;
CREATE POLICY "stories_insert_owner"
  ON stories FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Stories: solo el dueño puede eliminar
DROP POLICY IF EXISTS "stories_delete_owner" ON stories;
CREATE POLICY "stories_delete_owner"
  ON stories FOR DELETE
  USING (is_pet_owner(pet_id));

-- Story views: cualquiera puede ver
DROP POLICY IF EXISTS "story_views_select" ON story_views;
CREATE POLICY "story_views_select"
  ON story_views FOR SELECT
  USING (true);

-- Story views: cualquier autenticado puede registrar vista
DROP POLICY IF EXISTS "story_views_insert" ON story_views;
CREATE POLICY "story_views_insert"
  ON story_views FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Storage bucket para stories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories', 'stories', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies para stories
DROP POLICY IF EXISTS "stories_storage_select_public" ON storage.objects;
CREATE POLICY "stories_storage_select_public"
  ON storage.objects FOR SELECT USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "stories_storage_insert_auth" ON storage.objects;
CREATE POLICY "stories_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "stories_storage_delete_own" ON storage.objects;
CREATE POLICY "stories_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);
