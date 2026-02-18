-- ============================================================
-- PetSocial - Supabase Database Migration (IDEMPOTENTE)
-- Se puede ejecutar multiples veces sin error
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public', 'followers', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

CREATE TABLE IF NOT EXISTS pets (
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
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_country ON pets(country);
CREATE INDEX IF NOT EXISTS idx_pets_active ON pets(is_active);

-- privacy flag for pet profiles (added 2026-02)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS posts (
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

CREATE INDEX IF NOT EXISTS idx_posts_pet ON posts(pet_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hidden ON posts(is_hidden);

CREATE TABLE IF NOT EXISTS post_media (
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

CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS likes (
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pet_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_pet ON likes(pet_id);

CREATE TABLE IF NOT EXISTS comments (
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

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_pet ON comments(pet_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE TABLE IF NOT EXISTS bookmarks (
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pet_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_pet ON bookmarks(pet_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON bookmarks(post_id);

-- ============================================================
-- 3. FUNCIONES Y TRIGGERS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_pets_updated_at ON pets;
CREATE TRIGGER trg_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla de registro de emails
CREATE TABLE IF NOT EXISTS user_emails (
  auth_id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_emails_auth_id ON user_emails(auth_id);

-- Crear perfil automático al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_emails (auth_id, email, email_confirmed_at, source)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at, 'signup');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Contadores de followers
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

DROP TRIGGER IF EXISTS trg_follow_counts ON follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Contadores de likes en posts
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

DROP TRIGGER IF EXISTS trg_post_likes_count ON likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Contadores de comentarios en posts
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

DROP TRIGGER IF EXISTS trg_post_comments_count ON comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Contador de posts en pets
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

DROP TRIGGER IF EXISTS trg_pet_posts_count ON posts;
CREATE TRIGGER trg_pet_posts_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_pet_posts_count();

-- Helper: verificar si un pet pertenece al usuario actual
CREATE OR REPLACE FUNCTION is_pet_owner(pet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pets WHERE id = pet_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: verificar si un pet sigue a otro
CREATE OR REPLACE FUNCTION is_following(follower UUID, target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = follower AND following_id = target
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes antes de crearlas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname IN (
      'profiles_select_public', 'profiles_update_own',
      'pets_select_active', 'pets_insert_owner', 'pets_update_owner', 'pets_delete_owner',
      'posts_select_visible', 'posts_insert_owner', 'posts_update_owner', 'posts_delete_owner',
      'post_media_select', 'post_media_insert_owner', 'post_media_delete_owner',
      'follows_select_public', 'follows_insert_own_pet', 'follows_delete_own_pet',
      'likes_select_public', 'likes_insert_own_pet', 'likes_delete_own_pet',
      'comments_select_visible', 'comments_insert_own_pet', 'comments_update_own', 'comments_delete_own',
      'bookmarks_select_own', 'bookmarks_insert_own_pet', 'bookmarks_delete_own_pet'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- PETS
CREATE POLICY "pets_select_active"
  ON pets FOR SELECT USING (is_active = true);

CREATE POLICY "pets_insert_owner"
  ON pets FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (SELECT COUNT(*) FROM pets WHERE owner_id = auth.uid()) < 10
  );

CREATE POLICY "pets_update_owner"
  ON pets FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "pets_delete_owner"
  ON pets FOR DELETE USING (owner_id = auth.uid());

-- POSTS
CREATE POLICY "posts_select_visible"
  ON posts FOR SELECT
  USING (
    is_hidden = false
    AND (
      -- owner always allowed
      EXISTS (
        SELECT 1 FROM pets WHERE id = posts.pet_id AND owner_id = auth.uid()
      )
      -- if profile is private, only accepted followers see anything
      OR (
        NOT EXISTS (
          SELECT 1 FROM pets WHERE id = posts.pet_id AND is_private = true
        )
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
        )
      )
      -- even if profile is private, accepted followers can see posts regardless of visibility setting
      OR EXISTS (
        SELECT 1 FROM follows f
        JOIN pets p ON p.id = f.follower_id
        WHERE f.following_id = posts.pet_id
          AND f.status = 'accepted'
          AND p.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "posts_insert_owner"
  ON posts FOR INSERT WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "posts_update_owner"
  ON posts FOR UPDATE
  USING (is_pet_owner(pet_id))
  WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "posts_delete_owner"
  ON posts FOR DELETE USING (is_pet_owner(pet_id));

-- POST_MEDIA
CREATE POLICY "post_media_select"
  ON post_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts WHERE id = post_media.post_id));

CREATE POLICY "post_media_insert_owner"
  ON post_media FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_media.post_id AND is_pet_owner(p.pet_id)));

CREATE POLICY "post_media_delete_owner"
  ON post_media FOR DELETE
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_media.post_id AND is_pet_owner(p.pet_id)));

-- FOLLOWS
CREATE POLICY "follows_select_public"
  ON follows FOR SELECT USING (true);

CREATE POLICY "follows_insert_own_pet"
  ON follows FOR INSERT WITH CHECK (is_pet_owner(follower_id));

CREATE POLICY "follows_delete_own_pet"
  ON follows FOR DELETE USING (is_pet_owner(follower_id));

-- LIKES
CREATE POLICY "likes_select_public"
  ON likes FOR SELECT USING (true);

CREATE POLICY "likes_insert_own_pet"
  ON likes FOR INSERT WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "likes_delete_own_pet"
  ON likes FOR DELETE USING (is_pet_owner(pet_id));

-- COMMENTS
CREATE POLICY "comments_select_visible"
  ON comments FOR SELECT USING (is_hidden = false AND deleted_at IS NULL);

CREATE POLICY "comments_insert_own_pet"
  ON comments FOR INSERT WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE
  USING (is_pet_owner(pet_id))
  WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "comments_delete_own"
  ON comments FOR DELETE USING (is_pet_owner(pet_id));

-- BOOKMARKS
CREATE POLICY "bookmarks_select_own"
  ON bookmarks FOR SELECT USING (is_pet_owner(pet_id));

CREATE POLICY "bookmarks_insert_own_pet"
  ON bookmarks FOR INSERT WITH CHECK (is_pet_owner(pet_id));

CREATE POLICY "bookmarks_delete_own_pet"
  ON bookmarks FOR DELETE USING (is_pet_owner(pet_id));

-- ============================================================
-- 5. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media', 'post-media', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers', 'covers', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES (limpiar antes de crear)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname IN (
      'avatars_select_public', 'avatars_insert_auth', 'avatars_update_own', 'avatars_delete_own',
      'post_media_storage_select_public', 'post_media_storage_insert_auth', 'post_media_storage_delete_own',
      'covers_select_public', 'covers_insert_auth', 'covers_delete_own'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "post_media_storage_select_public"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "post_media_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "post_media_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "covers_select_public"
  ON storage.objects FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "covers_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "covers_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 6. GRANTS para el rol authenticated
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

GRANT SELECT ON pets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON pets TO authenticated;

GRANT SELECT ON posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;

GRANT SELECT ON post_media TO anon, authenticated;
GRANT INSERT, DELETE ON post_media TO authenticated;

GRANT SELECT ON follows TO anon, authenticated;
GRANT INSERT, DELETE ON follows TO authenticated;

GRANT SELECT ON likes TO anon, authenticated;
GRANT INSERT, DELETE ON likes TO authenticated;

GRANT SELECT ON comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;

GRANT SELECT ON bookmarks TO anon, authenticated;
GRANT INSERT, DELETE ON bookmarks TO authenticated;
