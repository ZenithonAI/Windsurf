import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';

export type AIConversation = Database['public']['Tables']['ai_conversations']['Row'];
export type CreateAIConversationInput = Database['public']['Tables']['ai_conversations']['Insert'];
export type UpdateAIConversationInput = Database['public']['Tables']['ai_conversations']['Update'];

export type AIMessage = Database['public']['Tables']['ai_messages']['Row'];
export type CreateAIMessageInput = Database['public']['Tables']['ai_messages']['Insert'];
export type UpdateAIMessageInput = Database['public']['Tables']['ai_messages']['Update'];

export type AISearchStat = Database['public']['Tables']['ai_search_stats']['Row'];
export type CreateAISearchStatInput = Database['public']['Tables']['ai_search_stats']['Insert'];
export type UpdateAISearchStatInput = Database['public']['Tables']['ai_search_stats']['Update'];

export class AIAssistantService {
  protected get supabase() {
    return createClient();
  }
  
  // Conversation methods
  async getConversations(): Promise<AIConversation[]> {
    const { data, error } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching AI conversations:', error);
      throw error;
    }
    
    return data as AIConversation[];
  }
  
  async getConversationById(id: string): Promise<AIConversation | null> {
    const { data, error } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching AI conversation:', error);
      throw error;
    }
    
    return data as AIConversation;
  }
  
  async createConversation(conversation: CreateAIConversationInput): Promise<AIConversation> {
    const { data, error } = await this.supabase
      .from('ai_conversations')
      .insert(conversation)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating AI conversation:', error);
      throw error;
    }
    
    return data as AIConversation;
  }
  
  async updateConversation(id: string, updates: UpdateAIConversationInput): Promise<AIConversation> {
    const { data, error } = await this.supabase
      .from('ai_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating AI conversation:', error);
      throw error;
    }
    
    return data as AIConversation;
  }
  
  async deleteConversation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting AI conversation:', error);
      throw error;
    }
  }
  
  // Message methods
  async getMessages(conversationId: string): Promise<AIMessage[]> {
    const { data, error } = await this.supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching AI messages:', error);
      throw error;
    }
    
    return data as AIMessage[];
  }
  
  async createMessage(message: CreateAIMessageInput): Promise<AIMessage> {
    const { data, error } = await this.supabase
      .from('ai_messages')
      .insert(message)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating AI message:', error);
      throw error;
    }
    
    // Update conversation updated_at timestamp
    await this.updateConversation(message.conversation_id, {
      updated_at: new Date().toISOString()
    });
    
    // If it's a user message with web search, update the search stats
    if (message.role === 'user' && message.web_search_used) {
      await this.incrementSearchCount();
    }
    
    return data as AIMessage;
  }
  
  // Search stats methods
  async getTodaySearchCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from('ai_search_stats')
      .select('search_count')
      .eq('search_date', today)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching today search count:', error);
      throw error;
    }
    
    return data?.search_count || 0;
  }
  
  async incrementSearchCount(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the current user ID
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    
    // First try to update an existing record
    const { data, error } = await this.supabase
      .from('ai_search_stats')
      .update({ 
        search_count: this.supabase.rpc('increment', { x: 1 }),
        updated_at: new Date().toISOString()
      })
      .eq('search_date', today)
      .eq('user_id', user.id)
      .select()
      .single();
      
    if (error) {
      // If no record exists, create one
      if (error.code === 'PGRST116') {
        const { error: insertError } = await this.supabase
          .from('ai_search_stats')
          .insert({
            user_id: user.id,
            search_date: today,
            search_count: 1
          });
          
        if (insertError) {
          console.error('Error creating search stat:', insertError);
          throw insertError;
        }
      } else {
        console.error('Error updating search count:', error);
        throw error;
      }
    }
  }
  
  // AI response simulation (in production, this would call an actual AI service)
  async simulateAIResponse(message: string): Promise<string> {
    // Simulate a delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      "I can help you with that! Let me know more details.",
      "That's a good question. Based on your personal data, I would suggest...",
      "I've analyzed your schedule and can recommend the following options...",
      "Looking at your habits and tasks, I think the best approach would be...",
      "Based on your goals and recent progress, I recommend focusing on...",
      "I've checked your financial data, and it seems like a good time to...",
      "Your journal entries indicate that you might benefit from...",
      "According to your project timeline, you should prioritize...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Create or continue a conversation
  async chat(message: string, conversationId?: string, useWebSearch: boolean = false): Promise<{
    conversationId: string;
    userMessage: AIMessage;
    assistantMessage: AIMessage;
  }> {
    // Get the current user
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // If no conversation ID provided, create a new one
    let conversation: AIConversation;
    
    if (!conversationId) {
      conversation = await this.createConversation({
        user_id: user.id,
        title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
      });
    } else {
      const existingConversation = await this.getConversationById(conversationId);
      
      if (!existingConversation) {
        throw new Error('Conversation not found');
      }
      
      conversation = existingConversation;
    }
    
    // Add user message
    const userMessage = await this.createMessage({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      web_search_used: useWebSearch
    });
    
    // Generate AI response
    const aiResponse = await this.simulateAIResponse(message);
    
    // Add AI message
    const assistantMessage = await this.createMessage({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse,
      web_search_used: false
    });
    
    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage
    };
  }
}

import { createClient } from '@/lib/supabase/client';
export const aiAssistantService = new AIAssistantService();