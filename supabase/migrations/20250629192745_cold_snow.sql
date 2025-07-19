/*
  # Fix Transaction RLS Policies

  1. Problem
    - Transaction creation is failing with RLS policy violations
    - Current policies are not properly allowing users to create transactions for their own accounts
    - Error code 42501 indicates RLS policy violation

  2. Solution
    - Drop existing transaction RLS policies
    - Create new, properly functioning RLS policies
    - Ensure policies correctly check account ownership through joins
    - Add proper policies for all CRUD operations

  3. Security
    - Users can only access transactions for accounts they own
    - All operations (SELECT, INSERT, UPDATE, DELETE) are properly secured
    - Policies use efficient joins to verify ownership
*/

-- Drop existing RLS policies for transactions
DROP POLICY IF EXISTS "Users can create transactions for their own accounts" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Create new, working RLS policies for transactions
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

-- Ensure RLS is enabled on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is enabled on accounts table (required for the policies to work)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;