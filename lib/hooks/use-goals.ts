import { useState, useEffect } from 'react';
import { Goal, GoalMilestone, goalService } from '@/lib/services/goal-service';
import { toast } from '@/hooks/use-toast';

export const useGoals = (filter?: { category?: string; status?: string }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const goals = await goalService.getGoals(filter?.category, filter?.status);
      setGoals(goals);
      setError(null);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch goals'));
      toast({
        title: 'Error',
        description: 'Failed to fetch goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [filter?.category, filter?.status]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await goalService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newGoal = await goalService.create({
        ...goal,
        user_id: user.id,
      });
      
      setGoals((prev) => [...prev, newGoal]);
      
      toast({
        title: 'Goal Created',
        description: 'Your goal has been created successfully.',
      });
      
      return newGoal;
    } catch (err) {
      console.error('Error adding goal:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const updatedGoal = await goalService.update(id, updates);
      
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? updatedGoal : goal))
      );
      
      toast({
        title: 'Goal Updated',
        description: 'Your goal has been updated successfully.',
      });
      
      return updatedGoal;
    } catch (err) {
      console.error('Error updating goal:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update goal. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await goalService.delete(id);
      
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
      
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting goal:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateGoalProgress = async (id: string, progress: number) => {
    try {
      // Update the goal progress in the database
      await goalService.updateGoalProgress(id, progress);
      
      // Update the local state
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? { ...goal, progress } : goal))
      );
      
      toast({
        title: 'Progress Updated',
        description: 'Goal progress has been updated successfully.',
      });
    } catch (err) {
      console.error('Error updating goal progress:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update goal progress. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    goals,
    isLoading,
    error,
    refetch: fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
  };
};

export const useGoalMilestones = (goalId: string) => {
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMilestones = async () => {
    if (!goalId) return;
    
    setIsLoading(true);
    try {
      const milestones = await goalService.getGoalMilestones(goalId);
      setMilestones(milestones);
      setError(null);
    } catch (err) {
      console.error('Error fetching goal milestones:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch goal milestones'));
      toast({
        title: 'Error',
        description: 'Failed to fetch goal milestones. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (goalId) {
      fetchMilestones();
    }
  }, [goalId]);

  const addMilestone = async (milestone: Omit<GoalMilestone, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMilestone = await goalService.createGoalMilestone({
        ...milestone,
        goal_id: goalId,
      });
      
      setMilestones((prev) => [...prev, newMilestone]);
      
      toast({
        title: 'Milestone Created',
        description: 'Goal milestone has been created successfully.',
      });
      
      return newMilestone;
    } catch (err) {
      console.error('Error adding goal milestone:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create goal milestone. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateMilestone = async (milestoneId: string, updates: Partial<GoalMilestone>) => {
    try {
      const updatedMilestone = await goalService.updateGoalMilestone(milestoneId, goalId, updates);
      
      setMilestones((prev) =>
        prev.map((milestone) => (milestone.id === milestoneId ? updatedMilestone : milestone))
      );
      
      toast({
        title: 'Milestone Updated',
        description: 'Goal milestone has been updated successfully.',
      });
      
      return updatedMilestone;
    } catch (err) {
      console.error('Error updating goal milestone:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update goal milestone. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    try {
      // First update the milestone to reflect it's being deleted
      setMilestones((prev) => prev.filter((milestone) => milestone.id !== milestoneId));
      
      // Then delete from the database
      await goalService.deleteGoalMilestone(milestoneId);
      
      // Recalculate goal progress
      await goalService.calculateGoalProgress(goalId);
      
      toast({
        title: 'Milestone Deleted',
        description: 'Goal milestone has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting goal milestone:', err);
      
      // Revert the optimistic update
      fetchMilestones();
      
      toast({
        title: 'Error',
        description: 'Failed to delete goal milestone. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const toggleMilestoneCompletion = async (milestoneId: string, isCompleted: boolean) => {
    try {
      const updatedMilestone = await goalService.toggleMilestoneCompletion(milestoneId, goalId, isCompleted);
      
      setMilestones((prev) =>
        prev.map((milestone) => (milestone.id === milestoneId ? updatedMilestone : milestone))
      );
      
      toast({
        title: updatedMilestone.is_completed ? 'Milestone Completed' : 'Milestone Reopened',
        description: updatedMilestone.is_completed
          ? 'Milestone marked as completed.'
          : 'Milestone has been reopened.',
      });
      
      return updatedMilestone;
    } catch (err) {
      console.error('Error toggling milestone completion:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update milestone status. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    milestones,
    isLoading,
    error,
    refetch: fetchMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestoneCompletion,
  };
};