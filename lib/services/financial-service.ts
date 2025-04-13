import { BaseService } from './base-service';
import { Database } from '@/lib/types/database.types';

export type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row'];
export type CreateFinancialAccountInput = Database['public']['Tables']['financial_accounts']['Insert'];
export type UpdateFinancialAccountInput = Database['public']['Tables']['financial_accounts']['Update'];

export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
export type CreateFinancialTransactionInput = Database['public']['Tables']['financial_transactions']['Insert'];
export type UpdateFinancialTransactionInput = Database['public']['Tables']['financial_transactions']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type CreateSubscriptionInput = Database['public']['Tables']['subscriptions']['Insert'];
export type UpdateSubscriptionInput = Database['public']['Tables']['subscriptions']['Update'];

export class FinancialService {
  protected get supabase() {
    return createClient();
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
  
  // Account methods
  async getAccounts(): Promise<FinancialAccount[]> {
    const { data, error } = await this.supabase
      .from('financial_accounts')
      .select('*');
      
    if (error) {
      console.error('Error fetching financial accounts:', error);
      throw error;
    }
    
    return data as FinancialAccount[];
  }
  
  async getAccountById(id: string): Promise<FinancialAccount | null> {
    const { data, error } = await this.supabase
      .from('financial_accounts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching financial account:', error);
      throw error;
    }
    
    return data as FinancialAccount;
  }
  
  async createAccount(account: CreateFinancialAccountInput): Promise<FinancialAccount> {
    const { data, error } = await this.supabase
      .from('financial_accounts')
      .insert(account)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating financial account:', error);
      throw error;
    }
    
    return data as FinancialAccount;
  }
  
  async updateAccount(id: string, updates: UpdateFinancialAccountInput): Promise<FinancialAccount> {
    const { data, error } = await this.supabase
      .from('financial_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating financial account:', error);
      throw error;
    }
    
    return data as FinancialAccount;
  }
  
  async deleteAccount(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('financial_accounts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting financial account:', error);
      throw error;
    }
  }
  
  // Transaction methods
  async getTransactions(filters?: {
    accountId?: string;
    type?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<FinancialTransaction[]> {
    let query = this.supabase.from('financial_transactions').select('*');
    
    if (filters) {
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.fromDate && filters.toDate) {
        query = query.gte('transaction_date', filters.fromDate).lte('transaction_date', filters.toDate);
      } else if (filters.fromDate) {
        query = query.gte('transaction_date', filters.fromDate);
      } else if (filters.toDate) {
        query = query.lte('transaction_date', filters.toDate);
      }
    }
    
    const { data, error } = await query.order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return data as FinancialTransaction[];
  }
  
  async getTransactionById(id: string): Promise<FinancialTransaction | null> {
    const { data, error } = await this.supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching transaction:', error);
      throw error;
    }
    
    return data as FinancialTransaction;
  }
  
  async createTransaction(transaction: CreateFinancialTransactionInput): Promise<FinancialTransaction> {
    const { data, error } = await this.supabase
      .from('financial_transactions')
      .insert(transaction)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
    
    // Update account balance if account_id is provided
    if (transaction.account_id) {
      await this.updateAccountBalance(transaction.account_id);
    }
    
    return data as FinancialTransaction;
  }
  
  async updateTransaction(id: string, updates: UpdateFinancialTransactionInput): Promise<FinancialTransaction> {
    const oldTransaction = await this.getTransactionById(id);
    
    const { data, error } = await this.supabase
      .from('financial_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
    
    // Update account balance if account_id changed or amount changed
    if (oldTransaction?.account_id) {
      await this.updateAccountBalance(oldTransaction.account_id);
    }
    
    if (updates.account_id && updates.account_id !== oldTransaction?.account_id) {
      await this.updateAccountBalance(updates.account_id);
    }
    
    return data as FinancialTransaction;
  }
  
  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.getTransactionById(id);
    
    const { error } = await this.supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
    
    // Update account balance
    if (transaction?.account_id) {
      await this.updateAccountBalance(transaction.account_id);
    }
  }
  
  async updateAccountBalance(accountId: string): Promise<void> {
    // Get all transactions for this account
    const transactions = await this.getTransactions({ accountId });
    
    // Calculate balance
    let balance = 0;
    
    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        balance += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        balance -= Number(transaction.amount);
      }
    }
    
    // Update account balance
    await this.updateAccount(accountId, { balance });
  }
  
  // Subscription methods
  async getSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .order('next_billing_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
    
    return data as Subscription[];
  }
  
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription:', error);
      throw error;
    }
    
    return data as Subscription;
  }
  
  async createSubscription(subscription: CreateSubscriptionInput): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
    
    return data as Subscription;
  }
  
  async updateSubscription(id: string, updates: UpdateSubscriptionInput): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
    
    return data as Subscription;
  }
  
  async deleteSubscription(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }
  
  async getMonthlyTotals(): Promise<{ income: number; expenses: number; savings: number; subscriptions: number }> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Get all transactions for this month
    const transactions = await this.getTransactions({
      fromDate: startOfMonth,
      toDate: endOfMonth
    });
    
    // Calculate income and expenses
    let income = 0;
    let expenses = 0;
    
    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        expenses += Number(transaction.amount);
      }
    }
    
    // Calculate savings
    const savings = income - expenses;
    
    // Get monthly subscription cost
    const subscriptions = await this.getSubscriptions();
    let subscriptionTotal = 0;
    
    for (const subscription of subscriptions) {
      subscriptionTotal += Number(subscription.amount);
    }
    
    return {
      income,
      expenses,
      savings,
      subscriptions: subscriptionTotal
    };
  }
  
  async getExpensesByCategory(): Promise<{ name: string; value: number; color: string }[]> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Get expense transactions for this month
    const transactions = await this.getTransactions({
      type: 'expense',
      fromDate: startOfMonth,
      toDate: endOfMonth
    });
    
    // Group by category
    const categoriesMap = new Map<string, number>();
    
    for (const transaction of transactions) {
      const category = transaction.category;
      const amount = Number(transaction.amount);
      
      if (categoriesMap.has(category)) {
        categoriesMap.set(category, categoriesMap.get(category)! + amount);
      } else {
        categoriesMap.set(category, amount);
      }
    }
    
    // Define colors for common categories
    const categoryColors: Record<string, string> = {
      'Housing': 'hsl(var(--chart-1))',
      'Food': 'hsl(var(--chart-2))',
      'Transport': 'hsl(var(--chart-3))',
      'Entertainment': 'hsl(var(--chart-4))',
      'Utilities': 'hsl(var(--chart-5))',
      'Shopping': 'hsl(12, 76%, 61%)',
      'Health': 'hsl(173, 58%, 39%)',
      'Education': 'hsl(197, 37%, 24%)',
      'Travel': 'hsl(43, 74%, 66%)'
    };
    
    // Convert to array format for charts
    const result = Array.from(categoriesMap.entries()).map(([name, value], index) => {
      return {
        name,
        value,
        color: categoryColors[name] || `hsl(${index * 40}, 70%, 50%)`
      };
    });
    
    return result;
  }
}

import { createClient } from '@/lib/supabase/client';
export const financialService = new FinancialService();