/*
  # Create financial management tables

  1. New Tables
    - `financial_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `name` (text)
      - `type` (text)
      - `balance` (decimal)
      - `currency` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `financial_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `account_id` (uuid, references financial_accounts.id)
      - `amount` (decimal)
      - `type` (text) - income, expense
      - `category` (text)
      - `description` (text)
      - `transaction_date` (date)
      - `created_at` (timestamptz)
    
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `name` (text)
      - `amount` (decimal)
      - `billing_cycle` (text)
      - `next_billing_date` (date)
      - `category` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations on their own financial data
*/

-- Financial accounts table
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'other')) DEFAULT 'checking',
  balance DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- Financial transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  next_billing_date DATE NOT NULL,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial accounts
CREATE POLICY "Users can read own financial accounts"
  ON public.financial_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial accounts"
  ON public.financial_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial accounts"
  ON public.financial_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial accounts"
  ON public.financial_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for financial transactions
CREATE POLICY "Users can read own financial transactions"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial transactions"
  ON public.financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial transactions"
  ON public.financial_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial transactions"
  ON public.financial_transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indices for performance
CREATE INDEX IF NOT EXISTS financial_account_user_id_idx ON public.financial_accounts (user_id);
CREATE INDEX IF NOT EXISTS financial_transaction_user_id_idx ON public.financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS financial_transaction_account_id_idx ON public.financial_transactions (account_id);
CREATE INDEX IF NOT EXISTS financial_transaction_date_idx ON public.financial_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS financial_transaction_type_idx ON public.financial_transactions (type);
CREATE INDEX IF NOT EXISTS subscription_user_id_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscription_next_billing_date_idx ON public.subscriptions (next_billing_date);