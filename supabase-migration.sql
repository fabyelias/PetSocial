-- ============================================================
-- PetSocial - Supabase Database Migration
-- Ejecutar este SQL completo en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENUMS (Tipos personalizados)
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other');
CREATE TYPE post_visibility AS ENUM ('public', 'followers', 'private');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- ============================================================
-- 2. TABLAS
-- ============================================================

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Mascotas
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL,
  breed TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  birth_date DATE,
  city TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_country ON pets(country);
CREATE INDEX idx_pets_active ON pets(is_active);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  caption TEXT CHECK (char_length(caption) <= 2200),
  visibility post_visibility NOT NULL DEFAULT 'public',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  engagement_score FLOAT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_pet ON posts(pet_id);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_engagement ON posts(engagement_score DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_hidden ON posts(is_hidden);

-- Media de posts (imágenes/videos)
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration FLOAT,
  file_size BIGINT,
  mime_type TEXT,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0 AND position < 10),
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_media_post ON post_media(post_id);

-- Seguidores (pet sigue a pet)
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Likes
CREATE TABLE likes (
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pet_id, post_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_pet ON likes(pet_id);

-- Comentarios (con respuestas anidadas)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_pet ON comments(pet_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Bookmarks (guardar posts)
CREATE TABLE bookmarks (
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pet_id, post_id)
);

CREATE INDEX idx_bookmarks_pet ON bookmarks(pet_id);
CREATE INDEX idx_bookmarks_post ON bookmarks(post_id);

-- ============================================================
-- 3. FUNCIONES AUXILIARES
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función: crear perfil automático al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función: actualizar contadores de followers
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pets SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE pets SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pets SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE pets SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Función: actualizar contadores de likes en posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Función: actualizar contadores de comentarios en posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE comments SET replies_count = replies_count - 1 WHERE id = OLD.parent_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Función: actualizar contador de posts en pets
CREATE OR REPLACE FUNCTION update_pet_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pets SET posts_count = posts_count + 1 WHERE id = NEW.pet_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pets SET posts_count = posts_count - 1 WHERE id = OLD.pet_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_pet_posts_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_pet_posts_count();

-- Función helper: verificar si un pet pertenece al usuario actual
CREATE OR REPLACE FUNCTION is_pet_owner(pet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pets WHERE id = pet_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper: verificar si un pet sigue a otro
CREATE OR REPLACE FUNCTION is_following(follower UUID, target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = follower AND following_id = target
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) - POLITICAS DE SEGURIDAD
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Cualquiera puede ver perfiles
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- PETS
-- ============================================================

-- Cualquiera puede ver mascotas activas
CREATE POLICY "pets_select_active"
  ON pets FOR SELECT
  USING (is_active = true);

-- Solo el dueño puede crear mascotas (máximo 10)
CREATE POLICY "pets_insert_owner"
  ON pets FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (SELECT COUNT(*) FROM pets WHERE owner_id = auth.uid()) < 10
  );

-- Solo el dueño puede actualizar sus mascotas
CREATE POLICY "pets_update_owner"
  ON pets FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Solo el dueño puede eliminar sus mascotas
CREATE POLICY "pets_delete_owner"
  ON pets FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- POSTS
-- ============================================================

-- Ver posts públicos, o de seguidores si sigues al pet, o propios
CREATE POLICY "posts_select_visible"
  ON posts FOR SELECT
  USING (
    is_hidden = false
    AND (
      visibility = 'public'
      OR (
        visibility = 'followers'
        AND EXISTS (
          SELECT 1 FROM follows f
          JOIN pets p ON p.id = f.follower_id
          WHERE f.following_id = posts.pet_id
            AND p.owner_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM pets WHERE id = posts.pet_id AND owner_id = auth.uid()
      )
    )
  );

-- Solo el dueño del pet puede crear posts
CREATE POLICY "posts_insert_owner"
  ON posts FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Solo el dueño del pet puede actualizar posts
CREATE POLICY "posts_update_owner"
  ON posts FOR UPDATE
  USING (is_pet_owner(pet_id))
  WITH CHECK (is_pet_owner(pet_id));

-- Solo el dueño del pet puede eliminar posts
CREATE POLICY "posts_delete_owner"
  ON posts FOR DELETE
  USING (is_pet_owner(pet_id));

-- ============================================================
-- POST_MEDIA
-- ============================================================

-- Ver media de posts que puedes ver
CREATE POLICY "post_media_select"
  ON post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_media.post_id
    )
  );

-- Solo el dueño del post puede agregar media
CREATE POLICY "post_media_insert_owner"
  ON post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_media.post_id AND is_pet_owner(p.pet_id)
    )
  );

-- Solo el dueño puede eliminar media
CREATE POLICY "post_media_delete_owner"
  ON post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_media.post_id AND is_pet_owner(p.pet_id)
    )
  );

-- ============================================================
-- FOLLOWS
-- ============================================================

-- Cualquiera puede ver follows
CREATE POLICY "follows_select_public"
  ON follows FOR SELECT
  USING (true);

-- Solo puedes seguir desde tus propias mascotas
CREATE POLICY "follows_insert_own_pet"
  ON follows FOR INSERT
  WITH CHECK (is_pet_owner(follower_id));

-- Solo puedes dejar de seguir desde tus propias mascotas
CREATE POLICY "follows_delete_own_pet"
  ON follows FOR DELETE
  USING (is_pet_owner(follower_id));

-- ============================================================
-- LIKES
-- ============================================================

-- Cualquiera puede ver likes
CREATE POLICY "likes_select_public"
  ON likes FOR SELECT
  USING (true);

-- Solo puedes dar like desde tus propias mascotas
CREATE POLICY "likes_insert_own_pet"
  ON likes FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Solo puedes quitar like desde tus propias mascotas
CREATE POLICY "likes_delete_own_pet"
  ON likes FOR DELETE
  USING (is_pet_owner(pet_id));

-- ============================================================
-- COMMENTS
-- ============================================================

-- Ver comentarios no ocultos
CREATE POLICY "comments_select_visible"
  ON comments FOR SELECT
  USING (is_hidden = false AND deleted_at IS NULL);

-- Solo puedes comentar desde tus propias mascotas
CREATE POLICY "comments_insert_own_pet"
  ON comments FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Solo puedes editar tus propios comentarios
CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE
  USING (is_pet_owner(pet_id))
  WITH CHECK (is_pet_owner(pet_id));

-- Solo puedes eliminar tus propios comentarios
CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE
  USING (is_pet_owner(pet_id));

-- ============================================================
-- BOOKMARKS
-- ============================================================

-- Solo puedes ver tus propios bookmarks
CREATE POLICY "bookmarks_select_own"
  ON bookmarks FOR SELECT
  USING (is_pet_owner(pet_id));

-- Solo puedes guardar desde tus propias mascotas
CREATE POLICY "bookmarks_insert_own_pet"
  ON bookmarks FOR INSERT
  WITH CHECK (is_pet_owner(pet_id));

-- Solo puedes quitar bookmarks propios
CREATE POLICY "bookmarks_delete_own_pet"
  ON bookmarks FOR DELETE
  USING (is_pet_owner(pet_id));

-- ============================================================
-- 5. STORAGE BUCKETS
-- ============================================================

-- Crear bucket para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Crear bucket para media de posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Crear bucket para covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Avatars: cualquiera puede ver, solo autenticados pueden subir/eliminar propios
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Post media: cualquiera puede ver, solo autenticados pueden subir/eliminar propios
CREATE POLICY "post_media_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "post_media_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_media_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Covers: cualquiera puede ver, solo autenticados pueden subir/eliminar propios
CREATE POLICY "covers_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "covers_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "covers_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
