/*
  # Fix RLS policies for transactions table

  1. Problem
    - Current RLS policies on transactions table are causing violations
    - Policies are not properly checking user ownership through account relationship
    - Users cannot create or update transactions even when they own the account

  2. Solution
    - Drop existing problematic RLS policies
    - Create new, properly structured RLS policies
    - Ensure policies correctly check user ownership through accounts table
    - Add proper policies for all CRUD operations

  3. Security
    - Users can only access transactions for accounts they own
    - All operations (SELECT, INSERT, UPDATE, DELETE) are properly secured
    - Policies use EXISTS clauses to verify account ownership
*/

-- Drop existing RLS policies for transactions table
DROP POLICY IF EXISTS "Users can create transactions for their accounts" ON transactions;
DROP POLICY IF EXISTS "Users can view transactions for their accounts" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their accounts" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their accounts" ON transactions;

-- Create new, properly structured RLS policies for transactions

-- Policy for SELECT (viewing transactions)
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- Policy for INSERT (creating transactions)
CREATE POLICY "Users can create transactions for their own accounts"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- Policy for UPDATE (updating transactions)
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
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

-- Policy for DELETE (deleting transactions)
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    )
  );