import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export type Task = Database['public']['Tables']['tasks']['Row'];
// Define types for the enums by inferring from the Task Row type
// Use NonNullable to remove the 'null' possibility from the column type
type TaskStatus = NonNullable<Task['status']>;
type TaskPriority = NonNullable<Task['priority']>;

export type CreateTaskInput = Database['public']['Tables']['tasks']['Insert'];
export type UpdateTaskInput = Database['public']['Tables']['tasks']['Update'];

export class TaskService extends BaseService<'tasks', Task> {
  constructor(client: SupabaseClient<Database>) {
    super('tasks', client);
  }
  
  async getTasks(filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    fromDate?: string;
    toDate?: string;
    userId?: string;
  }): Promise<Task[]> {
    console.log('📊 TaskService.getTasks called with filters:', filters);
    let query = this.supabase.from(this.tableName).select('*');
    
    if (filters) {
      // Always filter by user_id if provided - this is essential
      if (filters.userId) {
        console.log('📊 Filtering by user_id:', filters.userId);
        query = query.eq('user_id', filters.userId);
      } else {
        console.log('⚠️ Warning: No user_id provided in filters, this may return wrong results');
      }
      
      if (filters.status) {
        console.log('📊 Filtering by status:', filters.status);
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority) {
        console.log('📊 Filtering by priority:', filters.priority);
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.dueDate) {
        console.log('📊 Filtering by due date:', filters.dueDate);
        // Use a date range query for the whole day since database stores timestamps
        const startOfDay = `${filters.dueDate} 00:00:00`;
        const endOfDay = `${filters.dueDate} 23:59:59`;
        query = query.gte('due_date', startOfDay).lte('due_date', endOfDay);
      }
      
      if (filters.fromDate && filters.toDate) {
        console.log('📊 Filtering by date range:', { from: filters.fromDate, to: filters.toDate });
        // Add time components to make range queries work correctly with timestamp fields
        const fromDateTime = `${filters.fromDate} 00:00:00`;
        const toDateTime = `${filters.toDate} 23:59:59`;
        query = query.gte('due_date', fromDateTime).lte('due_date', toDateTime);
      } else if (filters.fromDate) {
        console.log('📊 Filtering by from date:', filters.fromDate);
        query = query.gte('due_date', `${filters.fromDate} 00:00:00`);
      } else if (filters.toDate) {
        console.log('📊 Filtering by to date:', filters.toDate);
        query = query.lte('due_date', `${filters.toDate} 23:59:59`);
      }
    }
    
    // Add better ordering - first by due date, then by priority (high first), then by title
    const { data, error } = await query
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false }) // high priority first
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    console.log(`📊 TaskService.getTasks retrieved ${data?.length || 0} tasks`);
    if (data && data.length > 0) {
      console.log('📊 Task priorities in result:', 
        data.reduce((counts: Record<string, number>, task) => {
          const priority = task.priority || 'unknown';
          counts[priority] = (counts[priority] || 0) + 1;
          return counts;
        }, {}));
      console.log('📊 Task statuses in result:', 
        data.reduce((counts: Record<string, number>, task) => {
          const status = task.status || 'unknown';
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {}));
    }
    
    return data || [];
  }
  
  async getTasksForToday(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getTasks({ dueDate: today });
  }
  
  async getTasksForTomorrow(): Promise<Task[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return this.getTasks({ dueDate: tomorrowStr });
  }
  
  async getTasksForNextWeek(): Promise<Task[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return this.getTasks({
      fromDate: today.toISOString().split('T')[0],
      toDate: nextWeek.toISOString().split('T')[0]
    });
  }
  
  async getCompletedTasks(): Promise<Task[]> {
    return this.getTasks({ status: 'completed' });
  }
  
  async toggleTaskStatus(id: string, currentStatus: string): Promise<Task> {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const updatedTask = await this.update(id, { status: newStatus } as UpdateTaskInput);
    return updatedTask;
  }
  
  /**
   * Deletes all completed tasks that were updated before the specified date
   * @param olderThan Date before which completed tasks should be deleted
   * @returns Number of tasks deleted
   */
  async deleteCompletedTasksOlderThan(olderThan: Date): Promise<number> {
    try {
      console.log('SAFETY CHECK - Only deleting tasks with status="completed" and updated_at <', olderThan.toISOString());
      
      // First, get the IDs of completed tasks older than the specified date
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('status', 'completed') // IMPORTANT: Only delete completed tasks
        .lt('updated_at', olderThan.toISOString());
      
      if (error) {
        console.error('Error fetching old completed tasks:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return 0; // No tasks to delete
      }
      
      // Extract the IDs
      const taskIds = data.map(task => task.id);
      
      // SAFETY CHECK: Make absolutely sure we're only deleting completed tasks
      if (taskIds.length > 20) {
        console.error('SAFETY LIMIT: Attempting to delete too many tasks at once:', taskIds.length);
        return 0; // Safety limit - don't delete if too many tasks would be affected
      }
      
      console.log('About to delete completed tasks with IDs:', taskIds);
      
      // Delete the tasks
      const { error: deleteError } = await this.supabase
        .from(this.tableName)
        .delete() 
        .in('id', taskIds)
        .eq('status', 'completed'); // Double-check to ONLY delete completed tasks
      
      if (deleteError) {
        console.error('Error deleting old completed tasks:', deleteError);
        throw deleteError;
      }
      
      return taskIds.length;
    } catch (err) {
      console.error('Error in deleteCompletedTasksOlderThan:', err);
      throw err;
    }
  }
}