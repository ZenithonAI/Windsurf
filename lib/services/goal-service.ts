import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';

export type Goal = Database['public']['Tables']['goals']['Row'];
export type CreateGoalInput = Database['public']['Tables']['goals']['Insert'];
export type UpdateGoalInput = Database['public']['Tables']['goals']['Update'];

export type GoalMilestone = Database['public']['Tables']['goal_milestones']['Row'];
export type CreateGoalMilestoneInput = Database['public']['Tables']['goal_milestones']['Insert'];
export type UpdateGoalMilestoneInput = Database['public']['Tables']['goal_milestones']['Update'];

export class GoalService extends BaseService<'goals', Goal> {
  constructor() {
    super('goals', createClient());
  }
  
  // Authentication helper method
  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
    return data.user;
  }
  
  async getGoals(category?: string, status?: string): Promise<Goal[]> {
    let query = this.supabase.from(this.tableName).select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('deadline', { ascending: true });
    
    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
    
    return data as Goal[];
  }
  
  async getActiveGoals(): Promise<Goal[]> {
    return this.getGoals(undefined, 'active');
  }
  
  async getGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
    const { data, error } = await this.supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('target_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching goal milestones:', error);
      throw error;
    }
    
    return data as GoalMilestone[];
  }
  
  async createGoalMilestone(milestone: CreateGoalMilestoneInput): Promise<GoalMilestone> {
    const { data, error } = await this.supabase
      .from('goal_milestones')
      .insert(milestone)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating goal milestone:', error);
      throw error;
    }
    
    // Recalculate goal progress
    await this.calculateGoalProgress(milestone.goal_id);
    
    return data as GoalMilestone;
  }
  
  async updateGoalMilestone(milestoneId: string, goalId: string, updates: UpdateGoalMilestoneInput): Promise<GoalMilestone> {
    const { data, error } = await this.supabase
      .from('goal_milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating goal milestone:', error);
      throw error;
    }
    
    // Recalculate goal progress
    await this.calculateGoalProgress(goalId);
    
    return data as GoalMilestone;
  }
  
  async toggleMilestoneCompletion(milestoneId: string, goalId: string, isCompleted: boolean): Promise<GoalMilestone> {
    return this.updateGoalMilestone(milestoneId, goalId, { is_completed: !isCompleted });
  }
  
  async calculateGoalProgress(goalId: string): Promise<number> {
    const milestones = await this.getGoalMilestones(goalId);
    
    if (milestones.length === 0) return 0;
    
    const completedMilestones = milestones.filter(milestone => milestone.is_completed).length;
    const progress = Math.round((completedMilestones / milestones.length) * 100);
    
    // Update the goal with the calculated progress
    await this.updateGoalProgress(goalId, progress);
    
    return progress;
  }
  
  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    const { error } = await this.supabase
      .from('goals')
      .update({ progress })
      .eq('id', goalId);
      
    if (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }
  
  // Goal milestone methods
  async deleteGoalMilestone(milestoneId: string): Promise<void> {
    const { error } = await this.supabase
      .from('goal_milestones')
      .delete()
      .eq('id', milestoneId);
      
    if (error) {
      console.error('Error deleting goal milestone:', error);
      throw error;
    }
  }
  
  // Additional helper method for goals
  async completeGoal(id: string) {
    const { error } = await this.supabase
      .from('goals')
      .update({ status: 'completed' })
      .eq('id', id);
      
    if (error) {
      console.error('Error completing goal:', error);
      throw error;
    }
  }
}

export const goalService = new GoalService();