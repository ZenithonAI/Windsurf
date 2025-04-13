import { useState, useEffect } from 'react';
import { Project, ProjectTask, projectService } from '@/lib/services/project-service';
import { toast } from '@/hooks/use-toast';

export const useProjects = (filter?: { status?: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const projects = await projectService.getProjects(filter?.status);
      setProjects(projects);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      toast({
        title: 'Error',
        description: 'Failed to fetch projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filter?.status]);

  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await projectService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newProject = await projectService.create({
        ...project,
        user_id: user.id,
      });
      
      setProjects((prev) => [...prev, newProject]);
      
      toast({
        title: 'Project Created',
        description: 'Your project has been created successfully.',
      });
      
      return newProject;
    } catch (err) {
      console.error('Error adding project:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectService.update(id, updates);
      
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? updatedProject : project))
      );
      
      toast({
        title: 'Project Updated',
        description: 'Your project has been updated successfully.',
      });
      
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectService.delete(id);
      
      setProjects((prev) => prev.filter((project) => project.id !== id));
      
      toast({
        title: 'Project Deleted',
        description: 'Your project has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateProjectProgress = async (id: string, progress: number) => {
    try {
      const updatedProject = await projectService.updateProjectProgress(id, progress);
      
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? updatedProject : project))
      );
      
      return updatedProject;
    } catch (err) {
      console.error('Error updating project progress:', err);
      toast({
        title: 'Error',
        description: 'Failed to update project progress. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectProgress,
  };
};

export const useProjectTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const tasks = await projectService.getProjectTasks(projectId);
      setTasks(tasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching project tasks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch project tasks'));
      toast({
        title: 'Error',
        description: 'Failed to fetch project tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const addTask = async (task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await projectService.createProjectTask({
        ...task,
        project_id: projectId,
      });
      
      setTasks((prev) => [...prev, newTask]);
      
      toast({
        title: 'Task Created',
        description: 'Project task has been created successfully.',
      });
      
      return newTask;
    } catch (err) {
      console.error('Error adding project task:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create project task. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    try {
      const updatedTask = await projectService.updateProjectTask(taskId, projectId, updates);
      
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      
      toast({
        title: 'Task Updated',
        description: 'Project task has been updated successfully.',
      });
      
      return updatedTask;
    } catch (err) {
      console.error('Error updating project task:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update project task. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await projectService.deleteProjectTask(taskId, projectId);
      
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      
      toast({
        title: 'Task Deleted',
        description: 'Project task has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting project task:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete project task. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      
      const updatedTask = await projectService.updateProjectTask(taskId, projectId, {
        status: newStatus,
      });
      
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      
      toast({
        title: newStatus === 'completed' ? 'Task Completed' : 'Task Reopened',
        description: newStatus === 'completed'
          ? 'Task marked as completed.'
          : 'Task has been reopened.',
      });
      
      return updatedTask;
    } catch (err) {
      console.error('Error toggling task status:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
};