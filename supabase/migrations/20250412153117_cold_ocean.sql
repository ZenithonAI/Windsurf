/*
  # Create projects planning tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `name` (text)
      - `description` (text)
      - `deadline` (timestamptz)
      - `status` (text)
      - `progress` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `project_tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects.id)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `due_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform CRUD operations on their own projects and project tasks
*/

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT CHECK (status IN ('not-started', 'in-progress', 'nearly-complete', 'completed', 'on-hold')) DEFAULT 'not-started',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project tasks table for milestones and subtasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'completed')) DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can read own projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for project tasks through project_id
CREATE POLICY "Users can read own project tasks"
  ON public.project_tasks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_tasks.project_id
    AND public.projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project tasks"
  ON public.project_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_tasks.project_id
    AND public.projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project tasks"
  ON public.project_tasks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_tasks.project_id
    AND public.projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project tasks"
  ON public.project_tasks
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_tasks.project_id
    AND public.projects.user_id = auth.uid()
  ));

-- Indices for performance
CREATE INDEX IF NOT EXISTS project_user_id_idx ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx ON public.project_tasks (project_id);
CREATE INDEX IF NOT EXISTS project_status_idx ON public.projects (status);
CREATE INDEX IF NOT EXISTS project_deadline_idx ON public.projects (deadline);