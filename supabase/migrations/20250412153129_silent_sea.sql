/*
  # Create goals tracking tables

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `title` (text)
      - `description` (text)
      - `category` (text) - personal, health, financial, career, education
      - `deadline` (timestamptz)
      - `progress` (integer)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `goal_milestones`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, references goals.id)
      - `title` (text)
      - `target_date` (timestamptz)
      - `is_completed` (boolean)
      - `notes` (text)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations on their own goals and milestones
*/

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('personal', 'health', 'finance', 'career', 'education', 'other')) DEFAULT 'personal',
  deadline TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Goal milestones table for tracking progress points
CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can read own goals"
  ON public.goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for goal milestones through goal_id
CREATE POLICY "Users can read own goal milestones"
  ON public.goal_milestones
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE public.goals.id = public.goal_milestones.goal_id
    AND public.goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own goal milestones"
  ON public.goal_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals
    WHERE public.goals.id = public.goal_milestones.goal_id
    AND public.goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own goal milestones"
  ON public.goal_milestones
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE public.goals.id = public.goal_milestones.goal_id
    AND public.goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own goal milestones"
  ON public.goal_milestones
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE public.goals.id = public.goal_milestones.goal_id
    AND public.goals.user_id = auth.uid()
  ));

-- Indices for performance
CREATE INDEX IF NOT EXISTS goal_user_id_idx ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS goal_milestones_goal_id_idx ON public.goal_milestones (goal_id);
CREATE INDEX IF NOT EXISTS goal_category_idx ON public.goals (category);
CREATE INDEX IF NOT EXISTS goal_status_idx ON public.goals (status);
CREATE INDEX IF NOT EXISTS goal_deadline_idx ON public.goals (deadline);