import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit' | 'cash';
          initial_balance: number;
          current_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'credit' | 'cash';
          initial_balance?: number;
          current_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'checking' | 'savings' | 'credit' | 'cash';
          initial_balance?: number;
          current_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: 'income' | 'expense';
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: 'income' | 'expense';
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          account_id: string;
          target_account_id: string | null; // Added for transfer transactions
          category_id: string | null;
          amount: number;
          description: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          created_at: string;
          updated_at: string;
          sync_status: 'synced' | 'pending' | 'conflict';
        };
        Insert: {
          id?: string;
          account_id: string;
          target_account_id?: string | null; // Added for transfer transactions
          category_id?: string | null;
          amount: number;
          description?: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          created_at?: string;
          updated_at?: string;
          sync_status?: 'synced' | 'pending' | 'conflict';
        };
        Update: {
          id?: string;
          account_id?: string;
          target_account_id?: string | null; // Added for transfer transactions
          category_id?: string | null;
          amount?: number;
          description?: string;
          date?: string;
          type?: 'income' | 'expense' | 'transfer';
          created_at?: string;
          updated_at?: string;
          sync_status?: 'synced' | 'pending' | 'conflict';
        };
      };
    };
  };
};