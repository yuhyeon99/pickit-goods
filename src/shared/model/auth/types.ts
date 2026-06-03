import type { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin';

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

export type AuthState = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

export type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};
