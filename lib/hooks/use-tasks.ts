import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskService, CreateTaskInput, UpdateTaskInput } from '@/lib/services/task-service';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

// Define types for the enums by inferring from the Task Row type
// Use NonNullable to remove the 'null' possibility from the column type
type TaskStatus = NonNullable<Task['status']>;
type TaskPriority = NonNullable<Task['priority']>;

export const useTasks = (initialFilter = {}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [userId, setUserId] = useState<string | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<{
    lastRun: Date | null;
    tasksDeleted: number;
  }>({ lastRun: null, tasksDeleted: 0 });
  const supabase = createClient();

  // Memoize the service instance
  const taskServiceInstance = useMemo(() => new TaskService(supabase), [supabase]);

  // Get the current user on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Error getting user:', err);
      }
    };

    getUserId();
  }, [supabase]);

  // Use useCallback to memoize the cleanup function
  const cleanupCompletedTasks = useCallback(async () => {
    try {
      // Only run cleanup once per session, or if it's been more than an hour
      const now = new Date();
      if (cleanupStatus.lastRun && 
          (now.getTime() - cleanupStatus.lastRun.getTime() < 60 * 60 * 1000)) {
        return;
      }
      
      // Calculate the date 24 hours ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      // Delete completed tasks older than 24 hours
      const deletedCount = await taskServiceInstance.deleteCompletedTasksOlderThan(oneDayAgo);
      
      // Show toast notification if any tasks were deleted
      if (deletedCount > 0) {
        toast({
          title: "Cleanup Complete",
          description: `${deletedCount} completed ${deletedCount === 1 ? 'task' : 'tasks'} older than 24 hours ${deletedCount === 1 ? 'has' : 'have'} been removed.`,
          variant: "default",
        });
      }
      
      // Update cleanup status
      setCleanupStatus({
        lastRun: now,
        tasksDeleted: deletedCount
      });
    } catch (error) {
      console.error('Error cleaning up completed tasks:', error);
      // Don't rethrow - we don't want this to break task fetching
    }
  }, [cleanupStatus, taskServiceInstance, toast]);

  // Use useCallback to memoize the function reference
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, check if we need to clean up old completed tasks
      await cleanupCompletedTasks();
      
      // Add userId to the filter if available
      const filtersWithUser = userId ? { ...filter, userId } : filter;
      console.log('🔑 Fetching tasks with user ID:', userId);
      
      const fetchedTasks = await taskServiceInstance.getTasks(filtersWithUser);
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, userId, cleanupCompletedTasks, taskServiceInstance]);

  // Re-fetch tasks when filter changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // fetchTasks already has filter and taskServiceInstance in its dependencies
  
  // addTask now expects the full task object including user_id
  const addTask = useCallback(async (task: CreateTaskInput): Promise<Task> => {
    try {
      // User check should happen in the component calling this hook before preparing the 'task' object.
      // We assume 'task' includes user_id here.
      const newTask = await taskServiceInstance.create(task);
 
      // Immediately update local state with the new task
      setTasks((prev) => {
        console.log('Current tasks before adding:', prev.length);
        console.log('Adding new task:', newTask);
        
        const updatedTasks = [...prev, newTask];
        
        // Log the updated tasks array for debugging
        console.log('Tasks after adding:', updatedTasks.length);
        
        return updatedTasks;
      });
 
      toast({
        title: 'Task Created',
        description: 'Your task has been created successfully.',
      });
 
      return newTask;
    } catch (err: any) {
      console.error('Error adding task:', err);
      const errorMessage = err?.message || 'Failed to create task. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [taskServiceInstance, setTasks, toast]);

  // updateTask expects a task id and update data
  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput): Promise<Task> => {
    try {
      const updatedTask = await taskServiceInstance.update(id, updates);
       
      setTasks((prev) => 
        prev.map((task) => task.id === id ? updatedTask : task)
      );
       
      return updatedTask;
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [taskServiceInstance, setTasks, toast]);

  // deleteTask expects a task id
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await taskServiceInstance.delete(id);
       
      setTasks((prev) => prev.filter((task) => task.id !== id));
       
      toast({
        title: 'Task Deleted',
        description: 'Your task has been deleted successfully.',
      });
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [taskServiceInstance, setTasks, toast]);

  // Renamed from toggleTaskStatus to toggleTaskComplete to better reflect its purpose
  const toggleTaskComplete = useCallback(async (id: string, currentStatus: string): Promise<Task> => {
    try {
      // Toggle between 'completed' and 'todo' statuses
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      const updatedTask = await taskServiceInstance.toggleTaskStatus(id, currentStatus);
       
      setTasks((prev) => 
        prev.map((task) => task.id === id ? updatedTask : task)
      );
       
      return updatedTask;
    } catch (err: any) {
      console.error('Error toggling task status:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update task status. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [taskServiceInstance, setTasks, toast]);

  const refetch = useCallback(async () => {
    console.log('🔄 Manually refetching tasks...');
    return fetchTasks();
  }, [fetchTasks]);

  const addTaskToLocalState = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, [setTasks]);

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    refetch,
    cleanup: {
      status: cleanupStatus,
      runManually: cleanupCompletedTasks
    },
    addTaskToLocalState
  };
};