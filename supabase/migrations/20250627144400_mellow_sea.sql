/*
  # Create default categories for income and expense

  1. New Tables
    - Categories table already exists, we'll populate it with default categories
  
  2. Default Categories
    - Income categories: Salary, Freelance, Investment, Other Income
    - Expense categories: Food & Dining, Transportation, Shopping, Bills & Utilities, 
      Entertainment, Healthcare, Travel, Education, Other Expense
  
  3. Security
    - Categories with user_id = NULL are default/system categories visible to all users
    - Users can create their own custom categories
*/

-- Insert default income categories
INSERT INTO categories (id, user_id, name, type, color) VALUES
  (gen_random_uuid(), NULL, 'Salary', 'income', '#10b981'),
  (gen_random_uuid(), NULL, 'Freelance', 'income', '#059669'),
  (gen_random_uuid(), NULL, 'Investment', 'income', '#047857'),
  (gen_random_uuid(), NULL, 'Business', 'income', '#065f46'),
  (gen_random_uuid(), NULL, 'Other Income', 'income', '#064e3b')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO categories (id, user_id, name, type, color) VALUES
  (gen_random_uuid(), NULL, 'Food & Dining', 'expense', '#ef4444'),
  (gen_random_uuid(), NULL, 'Transportation', 'expense', '#dc2626'),
  (gen_random_uuid(), NULL, 'Shopping', 'expense', '#b91c1c'),
  (gen_random_uuid(), NULL, 'Bills & Utilities', 'expense', '#991b1b'),
  (gen_random_uuid(), NULL, 'Entertainment', 'expense', '#7c2d12'),
  (gen_random_uuid(), NULL, 'Healthcare', 'expense', '#92400e'),
  (gen_random_uuid(), NULL, 'Travel', 'expense', '#a16207'),
  (gen_random_uuid(), NULL, 'Education', 'expense', '#a3a3a3'),
  (gen_random_uuid(), NULL, 'Personal Care', 'expense', '#737373'),
  (gen_random_uuid(), NULL, 'Other Expense', 'expense', '#525252')
ON CONFLICT DO NOTHING;