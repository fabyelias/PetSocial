-- =============================================
-- TABLA DE MENSAJES Y CONVERSACIONES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla de conversaciones
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_a_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  pet_b_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pet_a_id, pet_b_id)
);

-- 2. Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  receiver_pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_pet_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_conversations_pet_a ON public.conversations(pet_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_pet_b ON public.conversations(pet_b_id);

-- 4. RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id IN (pet_a_id, pet_b_id) AND pets.owner_id = auth.uid())
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_a_id AND pets.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.pets WHERE pets.id = pet_b_id AND pets.owner_id = auth.uid())
  );

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id IN (pet_a_id, pet_b_id) AND pets.owner_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id IN (sender_pet_id, receiver_pet_id) AND pets.owner_id = auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id = sender_pet_id AND pets.owner_id = auth.uid())
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.pets WHERE pets.id IN (sender_pet_id, receiver_pet_id) AND pets.owner_id = auth.uid())
  );

-- 5. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
