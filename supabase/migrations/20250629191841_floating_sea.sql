/*
  # Fix transactions table RLS INSERT policy

  1. Problem
    - Users cannot create transactions due to missing or incorrect INSERT policy
    - Policy may exist but not be working correctly

  2. Solution
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy with correct permissions
    - Ensure policy allows users to create transactions for their own accounts

  3. Security
    - Users can only create transactions for accounts they own
    - Policy checks account ownership through user_id
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can create transactions for their own accounts" ON transactions;

-- Create new INSERT policy for transactions table
CREATE POLICY "Users can create transactions for their own accounts"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM accounts
      WHERE accounts.id = transactions.account_id
      AND accounts.user_id = auth.uid()
    )
  );