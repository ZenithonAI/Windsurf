import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';

export type Project = Database['public']['Tables']['projects']['Row'];
export type CreateProjectInput = Database['public']['Tables']['projects']['Insert'];
export type UpdateProjectInput = Database['public']['Tables']['projects']['Update'];

export type ProjectTask = Database['public']['Tables']['project_tasks']['Row'];
export type CreateProjectTaskInput = Database['public']['Tables']['project_tasks']['Insert'];
export type UpdateProjectTaskInput = Database['public']['Tables']['project_tasks']['Update'];

export class ProjectService extends BaseService<'projects', Project> {
  constructor() {
    super('projects', createClient());
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
  
  async getProjects(status?: string): Promise<Project[]> {
    let query = this.supabase.from(this.tableName).select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('deadline', { ascending: true });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    return data as Project[];
  }
  
  async getActiveProjects(): Promise<Project[]> {
    return this.getProjects('in-progress');
  }
  
  async getUpcomingProjects(limit: number = 3): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .in('status', ['not-started', 'in-progress', 'nearly-complete'])
      .order('deadline', { ascending: true })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching upcoming projects:', error);
      throw error;
    }
    
    return data as Project[];
  }
  
  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const { data, error } = await this.supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching project tasks:', error);
      throw error;
    }
    
    return data as ProjectTask[];
  }
  
  async updateProjectProgress(projectId: string, progress: number): Promise<Project> {
    return this.update(projectId, { progress });
  }
  
  async calculateProjectProgress(projectId: string): Promise<number> {
    const tasks = await this.getProjectTasks(projectId);
    
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    // Update the project with the calculated progress
    await this.updateProjectProgress(projectId, progress);
    
    return progress;
  }
  
  async createProjectTask(task: CreateProjectTaskInput): Promise<ProjectTask> {
    const { data, error } = await this.supabase
      .from('project_tasks')
      .insert(task)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating project task:', error);
      throw error;
    }
    
    // Recalculate project progress
    await this.calculateProjectProgress(task.project_id);
    
    return data as ProjectTask;
  }
  
  async updateProjectTask(taskId: string, projectId: string, updates: UpdateProjectTaskInput): Promise<ProjectTask> {
    const { data, error } = await this.supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating project task:', error);
      throw error;
    }
    
    // Recalculate project progress
    await this.calculateProjectProgress(projectId);
    
    return data as ProjectTask;
  }
  
  async deleteProjectTask(taskId: string, projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);
      
    if (error) {
      console.error('Error deleting project task:', error);
      throw error;
    }
    
    // Recalculate project progress
    await this.calculateProjectProgress(projectId);
  }
}

export const projectService = new ProjectService();