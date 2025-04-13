import { useState } from 'react';
import { 
  AIConversation, 
  AIMessage, 
  aiAssistantService 
} from '@/lib/services/ai-assistant-service';
import { toast } from '@/hooks/use-toast';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const useAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const sendMessage = async (message: string, useWebSearch: boolean = false) => {
    if (!message.trim()) return;

    // Add user message to conversation immediately (optimistic update)
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    setIsLoading(true);
    
    try {
      const response = await aiAssistantService.chat(message, conversationId, useWebSearch);
      
      // Update conversation ID if this is a new conversation
      if (!conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add assistant message to conversation
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.assistantMessage.content 
      };
      
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      
    } catch (err) {
      console.error('Error sending message to AI assistant:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI assistant. Please try again.',
        variant: 'destructive',
      });
      
      // Remove the user message if there was an error
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
    setConversationId(undefined);
  };

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    resetConversation,
  };
};