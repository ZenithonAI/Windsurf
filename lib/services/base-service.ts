import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

export abstract class BaseService<
  TableName extends keyof Database['public']['Tables'],
  T extends Database['public']['Tables'][TableName]['Row']
> {
  protected tableName: TableName;
  protected supabase: SupabaseClient<Database>;

  constructor(tableName: TableName, supabaseClient: SupabaseClient<Database>) {
    this.tableName = tableName;
    this.supabase = supabaseClient;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*');

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      throw error;
    }

    return data as unknown as T[];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id' as any, id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Error fetching ${this.tableName} by ID:`, error);
      throw error;
    }

    return data as unknown as T;
  }

  async create(item: Database['public']['Tables'][TableName]['Insert']): Promise<T> {
    console.log(`⚙️ BaseService.create() called for table '${String(this.tableName)}'`);
    console.log(`⚙️ Input data:`, JSON.stringify(item, null, 2));

    // Log the Supabase client configuration (without sensitive info)
    console.log(`⚙️ Supabase client config:`, 'Client initialized');

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item as any)
      .select()
      .single();

    console.log(`⚙️ Supabase response:`, { 
      success: !error, 
      data: data ? JSON.stringify(data, null, 2) : 'null',
      error: error ? { 
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : 'null'
    });

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }

    return data as unknown as T;
  }

  async update(id: string, item: Database['public']['Tables'][TableName]['Update']): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(item as any)
      .eq('id' as any, id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }

    return data as unknown as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id' as any, id);

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }
}