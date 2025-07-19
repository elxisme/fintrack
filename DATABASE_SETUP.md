# Database Setup Instructions

Your Supabase project needs the database schema to be applied. The application is currently running in offline mode because the required tables don't exist in your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dnykdwigxudxmbksbspi`
3. Navigate to the **SQL Editor** in the left sidebar
4. Create a new query and copy the contents of `supabase/migrations/20250627141013_gentle_sound.sql`
5. Run the query to create the initial schema
6. Create another new query and copy the contents of `supabase/migrations/20250627144400_mellow_sea.sql`
7. Run the second query to add default categories

## Option 2: Manual Table Creation

If you prefer to create tables manually, here's what you need:

### 1. User Profiles Table
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Accounts Table
```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash')),
  initial_balance decimal(12,2) DEFAULT 0,
  current_balance decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
```

### 3. Categories Table
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

### 4. Transactions Table
```sql
CREATE TABLE transactions (
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
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

## Current Status

- ✅ Application is running in offline mode
- ✅ Default categories are created locally
- ❌ Database tables need to be created in Supabase
- ❌ Data sync is disabled until database is set up

Once you've applied the migrations, the application will automatically detect the database and enable online sync functionality.