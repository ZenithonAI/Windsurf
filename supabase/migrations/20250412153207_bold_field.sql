/*
  # Create AI assistant conversation tables

  1. New Tables
    - `ai_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references ai_conversations.id)
      - `role` (text) - user, assistant
      - `content` (text)
      - `web_search_used` (boolean)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations on their own conversations and messages
*/

-- AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- AI messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  web_search_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- AI search stats table to track daily searches
CREATE TABLE IF NOT EXISTS public.ai_search_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  search_date DATE DEFAULT CURRENT_DATE,
  search_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, search_date)
);

ALTER TABLE public.ai_search_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI conversations
CREATE POLICY "Users can read own AI conversations"
  ON public.ai_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI conversations"
  ON public.ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI conversations"
  ON public.ai_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI conversations"
  ON public.ai_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for AI messages through conversation_id
CREATE POLICY "Users can read own AI messages"
  ON public.ai_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE public.ai_conversations.id = public.ai_messages.conversation_id
    AND public.ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own AI messages"
  ON public.ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE public.ai_conversations.id = public.ai_messages.conversation_id
    AND public.ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own AI messages"
  ON public.ai_messages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE public.ai_conversations.id = public.ai_messages.conversation_id
    AND public.ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own AI messages"
  ON public.ai_messages
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE public.ai_conversations.id = public.ai_messages.conversation_id
    AND public.ai_conversations.user_id = auth.uid()
  ));

-- RLS Policies for AI search stats
CREATE POLICY "Users can read own AI search stats"
  ON public.ai_search_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI search stats"
  ON public.ai_search_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI search stats"
  ON public.ai_search_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS ai_conversation_user_id_idx ON public.ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ai_message_conversation_id_idx ON public.ai_messages (conversation_id);
CREATE INDEX IF NOT EXISTS ai_search_stats_user_date_idx ON public.ai_search_stats (user_id, search_date);