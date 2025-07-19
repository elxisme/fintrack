/*
  # Fix RLS Policies for All Tables

  This migration ensures all RLS policies are correctly configured to allow authenticated users
  to manage their own data across all tables.

  ## Changes Made
  1. Drop existing policies that might be conflicting
  2. Recreate comprehensive RLS policies for all tables
  3. Ensure transactions can be created/updated by account owners
  4. Allow access to default categories (user_id IS NULL)

  ## Security
  - Users can only access their own data
  - Transactions are accessible only through owned accounts
  - Default categories are accessible to all authenticated users
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can read own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can read categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create comprehensive RLS policies for accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create accounts for themselves"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for categories
CREATE POLICY "Users can view their own and default categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for transactions
CREATE POLICY "Users can view transactions for their accounts"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions for their accounts"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions for their accounts"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions for their accounts"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );