/*
  # Update default currency to Naira

  1. Changes
    - Update the default currency in user_profiles table from USD to NGN (Nigerian Naira)
    - Update existing user profiles that have USD to NGN if they haven't explicitly changed it
  
  2. Security
    - No changes to RLS policies needed
*/

-- Update the default value for currency column to NGN
ALTER TABLE user_profiles ALTER COLUMN currency SET DEFAULT 'NGN';

-- Update existing profiles that still have the old default (USD) to the new default (NGN)
-- This only affects users who haven't explicitly changed their currency
UPDATE user_profiles 
SET currency = 'NGN' 
WHERE currency = 'USD' 
AND updated_at = created_at; -- Only update if they haven't modified their profile