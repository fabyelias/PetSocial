-- =============================================
-- CONFIGURACIÓN DE STORAGE BUCKETS Y POLÍTICAS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Crear buckets de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('post-media', 'post-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Políticas para bucket 'avatars'
-- Cualquiera puede ver avatares (bucket público)
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Usuarios autenticados pueden subir avatares
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Usuarios pueden actualizar sus propios avatares
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Usuarios pueden eliminar sus propios avatares
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- 3. Políticas para bucket 'post-media'
CREATE POLICY "Post media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload post media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own post media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own post media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
  );

-- 4. Políticas para bucket 'covers'
CREATE POLICY "Covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users can upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- POLÍTICAS RLS PARA TABLAS PRINCIPALES
-- (Solo si no existen ya)
-- =============================================

-- 5. Políticas para 'posts'
DO $$ BEGIN
  -- Cualquiera puede ver posts públicos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Posts are viewable by everyone') THEN
    CREATE POLICY "Posts are viewable by everyone"
      ON public.posts FOR SELECT
      USING (true);
  END IF;

  -- Dueños de mascotas pueden crear posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Pet owners can create posts') THEN
    CREATE POLICY "Pet owners can create posts"
      ON public.posts FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  -- Dueños pueden actualizar sus posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Pet owners can update own posts') THEN
    CREATE POLICY "Pet owners can update own posts"
      ON public.posts FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  -- Dueños pueden eliminar sus posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Pet owners can delete own posts') THEN
    CREATE POLICY "Pet owners can delete own posts"
      ON public.posts FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 6. Políticas para 'post_media'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'Post media is viewable by everyone') THEN
    CREATE POLICY "Post media is viewable by everyone"
      ON public.post_media FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'Pet owners can add post media') THEN
    CREATE POLICY "Pet owners can add post media"
      ON public.post_media FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.posts
          JOIN public.pets ON pets.id = posts.pet_id
          WHERE posts.id = post_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'Pet owners can delete post media') THEN
    CREATE POLICY "Pet owners can delete post media"
      ON public.post_media FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.posts
          JOIN public.pets ON pets.id = posts.pet_id
          WHERE posts.id = post_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 7. Políticas para 'follows'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Follows are viewable by everyone') THEN
    CREATE POLICY "Follows are viewable by everyone"
      ON public.follows FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Pet owners can follow') THEN
    CREATE POLICY "Pet owners can follow"
      ON public.follows FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = follower_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Pet owners can unfollow') THEN
    CREATE POLICY "Pet owners can unfollow"
      ON public.follows FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = follower_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 8. Políticas para 'likes'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Likes are viewable by everyone') THEN
    CREATE POLICY "Likes are viewable by everyone"
      ON public.likes FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Pet owners can like') THEN
    CREATE POLICY "Pet owners can like"
      ON public.likes FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Pet owners can unlike') THEN
    CREATE POLICY "Pet owners can unlike"
      ON public.likes FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 9. Políticas para 'comments'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comments are viewable by everyone') THEN
    CREATE POLICY "Comments are viewable by everyone"
      ON public.comments FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Pet owners can comment') THEN
    CREATE POLICY "Pet owners can comment"
      ON public.comments FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Pet owners can delete own comments') THEN
    CREATE POLICY "Pet owners can delete own comments"
      ON public.comments FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 10. Políticas para 'bookmarks'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can view own bookmarks') THEN
    CREATE POLICY "Users can view own bookmarks"
      ON public.bookmarks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Pet owners can bookmark') THEN
    CREATE POLICY "Pet owners can bookmark"
      ON public.bookmarks FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Pet owners can remove bookmarks') THEN
    CREATE POLICY "Pet owners can remove bookmarks"
      ON public.bookmarks FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.pets
          WHERE pets.id = pet_id
          AND pets.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 11. Políticas para 'pets'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Pets are viewable by everyone') THEN
    CREATE POLICY "Pets are viewable by everyone"
      ON public.pets FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can create own pets') THEN
    CREATE POLICY "Users can create own pets"
      ON public.pets FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can update own pets') THEN
    CREATE POLICY "Users can update own pets"
      ON public.pets FOR UPDATE
      USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pets' AND policyname = 'Users can delete own pets') THEN
    CREATE POLICY "Users can delete own pets"
      ON public.pets FOR DELETE
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- 12. Políticas para 'profiles'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone') THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid());
  END IF;
END $$;

-- 13. Asegurar que RLS está habilitado en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
