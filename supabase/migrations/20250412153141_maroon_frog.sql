/*
  # Create journaling and notes tables

  1. New Tables
    - `journals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text)
      - `content` (text)
      - `mood` (text)
      - `entry_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations on their own journals and notes
*/

-- Journals table
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'neutral', 'productive', 'stressed', 'energetic', 'tired')),
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journals
CREATE POLICY "Users can read own journals"
  ON public.journals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals"
  ON public.journals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON public.journals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON public.journals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Users can read own notes"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS journal_user_id_idx ON public.journals (user_id);
CREATE INDEX IF NOT EXISTS journal_entry_date_idx ON public.journals (entry_date);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS notes_category_idx ON public.notes (category);