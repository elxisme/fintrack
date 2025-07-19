import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isAdmin: false,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    set({ user: data.user });
    if (data.user) {
      await get().loadUserProfile();
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      set({ user: data.user });
      // Profile creation is handled by the database trigger, no manual insertion needed
      // Wait a moment for the trigger to create the profile, then load it
      setTimeout(async () => {
        await get().loadUserProfile();
      }, 1000);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, userProfile: null, isAdmin: false });
  },

  loadUserProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ userProfile: null, isAdmin: false });
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        set({ userProfile: null, isAdmin: false });
        return;
      }

      const isAdmin = profile?.role === 'admin';
      set({ userProfile: profile, isAdmin });
    } catch (error) {
      console.error('Error loading user profile:', error);
      set({ userProfile: null, isAdmin: false });
    }
  },

  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, loading: false });
      
      if (user) {
        await get().loadUserProfile();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        const newUser = session?.user ?? null;
        set({ user: newUser });

        if (newUser) {
          await get().loadUserProfile();
        } else {
          set({ userProfile: null, isAdmin: false });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },
}));