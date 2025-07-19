/*
  # Add transfer support to transactions table

  1. Changes
    - Add target_account_id column to transactions table for transfer transactions
    - Update RLS policies to handle transfer transactions properly
    - Add check constraint to ensure transfer transactions have target_account_id

  2. Security
    - RLS policies updated to handle transfers between user's accounts
    - Ensure users can only create transfers between their own accounts
*/

-- Add target_account_id column for transfer transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'target_account_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN target_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraint to ensure transfer transactions have target_account_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'transfer_has_target_account'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transfer_has_target_account 
    CHECK (
      (type = 'transfer' AND target_account_id IS NOT NULL) OR 
      (type != 'transfer')
    );
  END IF;
END $$;

-- Update RLS policies to handle transfers properly
DROP POLICY IF EXISTS "Users can create transactions for their own accounts" ON transactions;

CREATE POLICY "Users can create transactions for their own accounts"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.account_id 
      AND accounts.user_id = auth.uid()
    ) AND (
      -- For non-transfer transactions, no additional check needed
      transactions.type != 'transfer' OR
      -- For transfer transactions, ensure target account is also owned by user
      (transactions.type = 'transfer' AND EXISTS (
        SELECT 1 FROM accounts 
        WHERE accounts.id = transactions.target_account_id 
        AND accounts.user_id = auth.uid()
      ))
    )
  );

-- Update other RLS policies to handle transfers
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;

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
    ) AND (
      -- For non-transfer transactions, no additional check needed
      transactions.type != 'transfer' OR
      -- For transfer transactions, ensure target account is also owned by user
      (transactions.type = 'transfer' AND EXISTS (
        SELECT 1 FROM accounts 
        WHERE accounts.id = transactions.target_account_id 
        AND accounts.user_id = auth.uid()
      ))
    )
  );