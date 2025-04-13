/*
  # Create habits tracking tables

  1. New Tables
    - `habits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `name` (text)
      - `description` (text)
      - `frequency` (text) - daily, weekly
      - `target_per_day` (integer)
      - `reminder_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `habit_logs`
      - `id` (uuid, primary key)
      - `habit_id` (uuid, references habits.id)
      - `user_id` (uuid, references profiles.id)
      - `completed_at` (timestamptz)
      - `progress` (integer)
      - `notes` (text)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations on their own habits and logs
*/

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  target_per_day INTEGER DEFAULT 1,
  reminder_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Habit logs table to track completion
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habits
CREATE POLICY "Users can read own habits"
  ON public.habits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON public.habits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for habit logs
CREATE POLICY "Users can read own habit logs"
  ON public.habit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs"
  ON public.habit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs"
  ON public.habit_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON public.habit_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS habit_user_id_idx ON public.habits (user_id);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON public.habit_logs (habit_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_id_idx ON public.habit_logs (user_id);
CREATE INDEX IF NOT EXISTS habit_logs_completed_at_idx ON public.habit_logs (completed_at);