import { useState, useEffect } from 'react';
import { Habit, HabitLog, habitService } from '@/lib/services/habit-service';
import { toast } from '@/hooks/use-toast';

export type HabitWithStreak = Habit & {
  streak: number;
  completed: boolean;
  progress: number;
  target: number;
};

// Type for data coming directly from the form
type HabitFormData = Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export const useHabits = () => {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const habits = await habitService.getHabitWithStreakInfo();
      console.log('[useHabits] Data received before setHabits:', habits);
      setHabits(habits);
      setError(null);
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch habits'));
      toast({
        title: 'Error',
        description: 'Failed to fetch habits. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const addHabit = async (habitData: HabitFormData) => {
    try {
      const user = await habitService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newHabit = await habitService.create({
        ...habitData,
        user_id: user.id,
      });
      
      // Refetch to get the streak info
      await fetchHabits();
      
      toast({
        title: 'Habit Created',
        description: 'Your habit has been created successfully.',
      });
      
      return newHabit;
    } catch (err) {
      console.error('Error adding habit:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create habit. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const updatedHabitFromDB = await habitService.update(id, updates);
      
      toast({
        title: 'Habit Updated',
        description: 'Your habit has been updated successfully.',
      });
      
      return updatedHabitFromDB; // Return the result from DB
    } catch (err) {
      console.error('Error updating habit:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update habit. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await habitService.delete(id);
      
      setHabits((prev) => prev.filter((habit) => habit.id !== id));
      
      toast({
        title: 'Habit Deleted',
        description: 'Your habit has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting habit:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete habit. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const toggleHabit = async (id: string, completed: boolean, progress: number, target: number) => {
    try {
      await habitService.toggleHabitCompletion(id, progress, target);
      
      // Refetch to get the updated streak info
      await fetchHabits();
      
      toast({
        title: !completed ? 'Habit Completed' : 'Habit Reset',
        description: !completed
          ? 'Habit marked as completed for today.'
          : 'Habit progress has been reset for today.',
      });
    } catch (err) {
      console.error('Error toggling habit:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update habit status. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const incrementProgress = async (id: string, currentProgress: number, target: number) => {
    if (currentProgress >= target) return;
    
    try {
      await habitService.toggleHabitCompletion(id, currentProgress, target);
      
      // Refetch to get the updated progress info
      await fetchHabits();
      
      const newProgress = Math.min(currentProgress + 1, target);
      const completed = newProgress >= target;
      
      if (completed) {
        toast({
          title: 'Habit Completed',
          description: 'Habit marked as completed for today.',
        });
      } else {
        toast({
          title: 'Progress Updated',
          description: `Progress: ${newProgress}/${target}`,
        });
      }
    } catch (err) {
      console.error('Error incrementing habit progress:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update habit progress. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    habits,
    isLoading,
    error,
    refetch: fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    incrementProgress,
  };
};