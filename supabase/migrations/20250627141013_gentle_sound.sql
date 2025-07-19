/*
  # Personal Finance Tracker Database Schema

  1. New Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `type` (text - 'checking', 'savings', 'credit', 'cash')
      - `initial_balance` (decimal)
      - `current_balance` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for default categories)
      - `name` (text)
      - `type` (text - 'income', 'expense')
      - `color` (text)
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references accounts)
      - `category_id` (uuid, references categories)
      - `amount` (decimal)
      - `description` (text)
      - `date` (date)
      - `type` (text - 'income', 'expense', 'transfer')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `sync_status` (text - 'synced', 'pending', 'conflict')
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `currency` (text, default 'USD')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash')),
  initial_balance decimal(12,2) DEFAULT 0,
  current_balance decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for accounts
CREATE POLICY "Users can read own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- Insert default categories
INSERT INTO categories (user_id, name, type, color) VALUES
  (NULL, 'Salary', 'income', '#10b981'),
  (NULL, 'Freelance', 'income', '#059669'),
  (NULL, 'Investments', 'income', '#047857'),
  (NULL, 'Groceries', 'expense', '#ef4444'),
  (NULL, 'Rent', 'expense', '#dc2626'),
  (NULL, 'Utilities', 'expense', '#b91c1c'),
  (NULL, 'Transportation', 'expense', '#f97316'),
  (NULL, 'Entertainment', 'expense', '#8b5cf6'),
  (NULL, 'Healthcare', 'expense', '#ec4899'),
  (NULL, 'Shopping', 'expense', '#6366f1')
ON CONFLICT DO NOTHING;