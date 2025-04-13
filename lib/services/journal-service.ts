import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';
import { createClient } from '@/lib/supabase/client';

export type Journal = Database['public']['Tables']['journals']['Row'];
export type CreateJournalInput = Database['public']['Tables']['journals']['Insert'];
export type UpdateJournalInput = Database['public']['Tables']['journals']['Update'];

export type Note = Database['public']['Tables']['notes']['Row'];
export type CreateNoteInput = Database['public']['Tables']['notes']['Insert'];
export type UpdateNoteInput = Database['public']['Tables']['notes']['Update'];

export class JournalService extends BaseService<'journals', Journal> {
  constructor() {
    super('journals', createClient());
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
  
  async getJournals(fromDate?: string, toDate?: string): Promise<Journal[]> {
    let query = this.supabase.from(this.tableName).select('*');
    
    if (fromDate && toDate) {
      query = query.gte('entry_date', fromDate).lte('entry_date', toDate);
    } else if (fromDate) {
      query = query.gte('entry_date', fromDate);
    } else if (toDate) {
      query = query.lte('entry_date', toDate);
    }
    
    const { data, error } = await query.order('entry_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching journals:', error);
      throw error;
    }
    
    return data as Journal[];
  }
  
  async getJournalByDate(date: string): Promise<Journal | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('entry_date', date)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching journal by date:', error);
      throw error;
    }
    
    return data as Journal | null;
  }
  
  async createJournalEntry(entry: CreateJournalInput): Promise<Journal> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(entry)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
    
    return data as Journal;
  }
}

export class NoteService extends BaseService<'notes', Note> {
  constructor() {
    super('notes', createClient());
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
  
  async getNotes(category?: string): Promise<Note[]> {
    let query = this.supabase.from(this.tableName).select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
    
    return data as Note[];
  }
  
  async getNoteCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('category');
      
    if (error) {
      console.error('Error fetching note categories:', error);
      throw error;
    }
    
    // Filter out null values and extract unique categories
    const categories = Array.from(new Set(data.map(item => item.category).filter((category): category is string => category !== null)));
    return categories;
  }
}

export const journalService = new JournalService();
export const noteService = new NoteService();