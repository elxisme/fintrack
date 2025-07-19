# Fix Database Connection Error

Your Supabase credentials are correct, but the database tables need to be created. Follow these steps:

## Step 1: Apply Database Migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dnykdwigxudxmbksbspi`
3. Navigate to the **SQL Editor** in the left sidebar
4. Create a new query and copy the entire contents of `supabase/migrations/20250627141013_gentle_sound.sql`
5. Run the query to create the initial schema
6. Create another new query and copy the contents of `supabase/migrations/20250627143723_sunny_darkness.sql`
7. Run the second query to fix user signup issues
8. Create a third new query and copy the contents of `supabase/migrations/20250627144400_mellow_sea.sql`
9. Run the third query to add default categories

## Step 2: Verify Tables Are Created

After running the migrations, verify these tables exist in your database:
- `user_profiles`
- `accounts` 
- `categories`
- `transactions`

## Step 3: Test the Application

Once the tables are created, refresh your application. The "Failed to fetch" error should be resolved and you should be able to:
- Sign up for new accounts
- Sign in with existing accounts
- Create accounts and transactions
- Sync data between offline and online modes

## What This Fixes

The error occurs because the application tries to:
1. Check user authentication status
2. Load user profile data
3. Sync with database tables

Without the proper database schema, these operations fail with "Failed to fetch" errors.

## Next Steps

After applying the migrations:
1. Try signing up for a new account
2. The welcome message should show your name
3. You can create accounts and transactions
4. Data will sync between offline and online modes