import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { supabase } from '../../api/supabaseClient';
import { AuthContext } from './authContext';
import type { AuthContextValue, Profile } from './types';

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: Profile['role'];
};

function getDisplayName(user: User) {
  const metadata = user.user_metadata;
  const emailPrefix = user.email?.split('@')[0] ?? null;
  return metadata.name ?? metadata.full_name ?? emailPrefix;
}

function getAvatarUrl(user: User) {
  const metadata = user.user_metadata;
  return metadata.avatar_url ?? metadata.picture ?? null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  };
}

async function loadOrCreateProfile(user: User): Promise<Profile> {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()
    .returns<ProfileRow | null>();

  if (selectError) {
    throw selectError;
  }

  if (existingProfile) {
    return mapProfile(existingProfile);
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: getDisplayName(user),
      avatar_url: getAvatarUrl(user),
      role: 'user',
    })
    .select('id, display_name, avatar_url, role')
    .single()
    .returns<ProfileRow>();

  if (insertError) {
    throw insertError;
  }

  return mapProfile(createdProfile);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    setError(null);

    if (!nextUser) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await loadOrCreateProfile(nextUser);
      setProfile(nextProfile);
    } catch (profileError) {
      setProfile(null);
      setError(
        profileError instanceof Error
          ? profileError.message
          : '프로필을 불러오지 못했습니다.',
      );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      setIsLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      await applyUser(data.session?.user ?? null);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyUser]);

  const signInWithGoogle = useCallback(async () => {
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      error,
      isAuthenticated: Boolean(user),
      isAdmin: profile?.role === 'admin',
      signInWithGoogle,
      signOut,
    }),
    [error, isLoading, profile, signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
