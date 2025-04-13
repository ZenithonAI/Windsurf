import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';

export type Habit = Database['public']['Tables']['habits']['Row'];
export type CreateHabitInput = Database['public']['Tables']['habits']['Insert'];
export type UpdateHabitInput = Database['public']['Tables']['habits']['Update'];

export type HabitLog = Database['public']['Tables']['habit_logs']['Row'];
export type CreateHabitLogInput = Database['public']['Tables']['habit_logs']['Insert'];

export class HabitService extends BaseService<'habits', Habit> {
  constructor() {
    super('habits', createClient());
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
  
  async getHabits(): Promise<Habit[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
    
    console.log('[HabitService] Raw habits fetched:', data);
    return data as Habit[];
  }
  
  async getHabitWithStreakInfo(): Promise<(Habit & { streak: number; completed: boolean; progress: number; target: number })[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all habits
    const habits = await this.getHabits();
    
    // Get habit logs for today to check completion
    const { data: todayLogs, error: todayLogsError } = await this.supabase
      .from('habit_logs')
      .select('*')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);
      
    if (todayLogsError) {
      console.error('Error fetching today logs:', todayLogsError);
      throw todayLogsError;
    }
    
    // Calculate streaks for each habit
    const habitsWithStreak = await Promise.all(habits.map(async (habit) => {
      // Check if habit is completed today
      const habitLog = todayLogs?.find(log => log.habit_id === habit.id);
      const completed = !!habitLog;
      const progress = habitLog?.progress || 0;
      
      // Calculate streak
      const { data: logs, error: streakError } = await this.supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habit.id)
        .order('completed_at', { ascending: false });
        
      if (streakError) {
        console.error('Error fetching habit logs for streak:', streakError);
        throw streakError;
      }
      
      let streak = 0;
      
      if (logs && logs.length > 0) {
        // Calculate streak based on consecutive days
        const dates = logs
          .filter(log => log.completed_at !== null) // Filter out logs with null completed_at
          .map(log => new Date(log.completed_at!).toISOString().split('T')[0]);
        
        // Remove duplicates (multiple logs on same day)
        const uniqueDates = Array.from(new Set(dates));
        
        // Sort dates in descending order
        uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        // Calculate streak
        let currentDate = new Date(uniqueDates[0]);
        streak = 1;
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedPrevDate = new Date(currentDate);
          expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
          
          const actualPrevDate = new Date(uniqueDates[i]);
          
          if (expectedPrevDate.toISOString().split('T')[0] === actualPrevDate.toISOString().split('T')[0]) {
            streak++;
            currentDate = actualPrevDate;
          } else {
            break;
          }
        }
      }
      
      const result = {
        ...habit,
        streak,
        completed,
        progress,
        target: habit.target_per_day || 1, // Ensure target is included
      };
      // console.log(`[HabitService] Processed habit ${habit.id}:`, result); // Optional: log each processed habit
      return result;
    }));
    
    console.log('[HabitService] Final habitsWithStreak:', habitsWithStreak);
    return habitsWithStreak;
  }
  
  async logHabitCompletion(habitId: string, progress: number = 1, notes?: string): Promise<HabitLog> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await this.supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        progress,
        notes,
        user_id: user.id,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error logging habit completion:', error);
      throw error;
    }
    
    return data as HabitLog;
  }
  
  async toggleHabitCompletion(habitId: string, currentProgress: number, targetProgress: number): Promise<HabitLog | null> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if habit already has a log for today
    const { data: existingLog, error: logError } = await this.supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)
      .maybeSingle();
      
    if (logError) {
      console.error('Error checking existing habit log:', logError);
      throw logError;
    }
    
    // If the habit is already completed and progress === target, reset progress
    if (existingLog && currentProgress >= targetProgress) {
      const { error: deleteError } = await this.supabase
        .from('habit_logs')
        .delete()
        .eq('id', existingLog.id);
        
      if (deleteError) {
        console.error('Error deleting habit log:', deleteError);
        throw deleteError;
      }
      
      return null;
    } 
    // If the habit has a log but progress < target, update progress
    else if (existingLog) {
      const newProgress = Math.min(currentProgress + 1, targetProgress);
      
      const { data: updatedLog, error: updateError } = await this.supabase
        .from('habit_logs')
        .update({ progress: newProgress })
        .eq('id', existingLog.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating habit log:', updateError);
        throw updateError;
      }
      
      return updatedLog;
    } 
    // If no log exists, create one
    else {
      return this.logHabitCompletion(habitId);
    }
  }
}

export const habitService = new HabitService();