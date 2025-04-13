import { useState, useEffect } from 'react';
import {
  FinancialAccount,
  FinancialTransaction,
  Subscription,
  financialService
} from '@/lib/services/financial-service';
import { toast } from '@/hooks/use-toast';

export const useFinancialAccounts = () => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const accounts = await financialService.getAccounts();
      setAccounts(accounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial accounts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch financial accounts'));
      toast({
        title: 'Error',
        description: 'Failed to fetch financial accounts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const addAccount = async (account: Omit<FinancialAccount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await financialService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newAccount = await financialService.createAccount({
        ...account,
        user_id: user.id,
      });
      
      setAccounts((prev) => [...prev, newAccount]);
      
      toast({
        title: 'Account Created',
        description: 'Your financial account has been created successfully.',
      });
      
      return newAccount;
    } catch (err) {
      console.error('Error adding financial account:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create financial account. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateAccount = async (id: string, updates: Partial<FinancialAccount>) => {
    try {
      const updatedAccount = await financialService.updateAccount(id, updates);
      
      setAccounts((prev) =>
        prev.map((account) => (account.id === id ? updatedAccount : account))
      );
      
      toast({
        title: 'Account Updated',
        description: 'Your financial account has been updated successfully.',
      });
      
      return updatedAccount;
    } catch (err) {
      console.error('Error updating financial account:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update financial account. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await financialService.deleteAccount(id);
      
      setAccounts((prev) => prev.filter((account) => account.id !== id));
      
      toast({
        title: 'Account Deleted',
        description: 'Your financial account has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting financial account:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete financial account. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
};

export const useFinancialTransactions = (filters?: {
  accountId?: string;
  type?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const transactions = await financialService.getTransactions(filters);
      setTransactions(transactions);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch financial transactions'));
      toast({
        title: 'Error',
        description: 'Failed to fetch financial transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [JSON.stringify(filters)]);

  const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at'>) => {
    try {
      const user = await financialService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newTransaction = await financialService.createTransaction({
        ...transaction,
        user_id: user.id,
      });
      
      setTransactions((prev) => [newTransaction, ...prev]);
      
      toast({
        title: 'Transaction Created',
        description: 'Your financial transaction has been created successfully.',
      });
      
      return newTransaction;
    } catch (err) {
      console.error('Error adding financial transaction:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create financial transaction. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>) => {
    try {
      const updatedTransaction = await financialService.updateTransaction(id, updates);
      
      setTransactions((prev) =>
        prev.map((transaction) => (transaction.id === id ? updatedTransaction : transaction))
      );
      
      toast({
        title: 'Transaction Updated',
        description: 'Your financial transaction has been updated successfully.',
      });
      
      return updatedTransaction;
    } catch (err) {
      console.error('Error updating financial transaction:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update financial transaction. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await financialService.deleteTransaction(id);
      
      setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
      
      toast({
        title: 'Transaction Deleted',
        description: 'Your financial transaction has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting financial transaction:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete financial transaction. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const subscriptions = await financialService.getSubscriptions();
      setSubscriptions(subscriptions);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
      toast({
        title: 'Error',
        description: 'Failed to fetch subscriptions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const addSubscription = async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await financialService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const newSubscription = await financialService.createSubscription({
        ...subscription,
        user_id: user.id,
      });
      
      setSubscriptions((prev) => [...prev, newSubscription]);
      
      toast({
        title: 'Subscription Created',
        description: 'Your subscription has been created successfully.',
      });
      
      return newSubscription;
    } catch (err) {
      console.error('Error adding subscription:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to create subscription. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      const updatedSubscription = await financialService.updateSubscription(id, updates);
      
      setSubscriptions((prev) =>
        prev.map((subscription) => (subscription.id === id ? updatedSubscription : subscription))
      );
      
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been updated successfully.',
      });
      
      return updatedSubscription;
    } catch (err) {
      console.error('Error updating subscription:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to update subscription. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await financialService.deleteSubscription(id);
      
      setSubscriptions((prev) => prev.filter((subscription) => subscription.id !== id));
      
      toast({
        title: 'Subscription Deleted',
        description: 'Your subscription has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting subscription:', err);
      
      toast({
        title: 'Error',
        description: 'Failed to delete subscription. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
};

export const useFinancialOverview = () => {
  const [overview, setOverview] = useState<{
    income: number;
    expenses: number;
    savings: number;
    subscriptions: number;
  }>({
    income: 0,
    expenses: 0,
    savings: 0,
    subscriptions: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<{
    name: string;
    value: number;
    color: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const [monthlyTotals, expenseCategories] = await Promise.all([
        financialService.getMonthlyTotals(),
        financialService.getExpensesByCategory(),
      ]);
      
      setOverview(monthlyTotals);
      setExpensesByCategory(expenseCategories);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial overview:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch financial overview'));
      toast({
        title: 'Error',
        description: 'Failed to fetch financial overview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return {
    overview,
    expensesByCategory,
    isLoading,
    error,
    refetch: fetchOverview,
  };
};