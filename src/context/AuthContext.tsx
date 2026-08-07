import React, { useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { authService, clearLegacyLocalSession } from '../services/authService';
import { UserProfile } from '../types/auth';
import { AuthContext } from '../hooks/useAuth';

import { profileService } from '../services/profileService';

const AUTHENTICATED_EVENTS = new Set([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'TOKEN_REFRESHED',
  'USER_UPDATED',
]);

const DEFAULT_USER: UserProfile = {
  id: 'usr_default',
  email: '',
  fullName: 'User',
  phone: '',
  avatarUrl: undefined,
  createdAt: new Date().toISOString(),
};

async function loadSavedUserProfile(): Promise<UserProfile> {
  try {
    const saved = await profileService.getFullProfile('usr_default');
    if (saved && (saved.fullName || saved.username)) {
      return {
        id: 'usr_default',
        email: saved.email || '',
        fullName: saved.fullName || saved.username || 'User',
        phone: saved.phone || '',
        avatarUrl: saved.avatarUrl || undefined,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[AuthContext] Error loading saved user profile:', err);
  }
  return DEFAULT_USER;
}

async function resolveUserFromSession(session: Session): Promise<UserProfile | null> {
  const formatted = authService.formatUser(session.user);
  const dbProfile = await authService.fetchProfile(session.user.id);
  return dbProfile || formatted;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await clearLegacyLocalSession();
        const activeProfile = await loadSavedUserProfile();

        if (!isSupabaseConfigured()) {
          console.warn('[AuthContext] Supabase not configured — using active user profile');
          setSession(null);
          setUser(activeProfile);
          return;
        }

        console.log('[AuthContext] Checking existing Supabase session on launch');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] getSession error:', error.message);
          setSession(null);
          setUser(activeProfile);
          return;
        }

        if (data.session?.user) {
          console.log('[AuthContext] Restored session for user:', data.session.user.id);
          console.log('[AuthContext] Session created — access token present:', !!data.session.access_token);
          const resolvedUser = await resolveUserFromSession(data.session);
          setSession(data.session);
          setUser(resolvedUser || activeProfile);
          setIsGuest(false);
        } else {
          console.log('[AuthContext] No active Supabase session — using active profile');
          setSession(null);
          // Always set a default user so isAuthenticated = true for user role
          setUser(activeProfile);
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth session:', err);
        setSession(null);
        setUser(DEFAULT_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    if (!isSupabaseConfigured()) {
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log('[AuthContext] Auth state change event:', event);

      if (nextSession?.user && AUTHENTICATED_EVENTS.has(event)) {
        console.log('[AuthContext] Session user received:', nextSession.user.id);
        console.log('[AuthContext] Session created — access token present:', !!nextSession.access_token);
        const resolvedUser = await resolveUserFromSession(nextSession);
        setSession(nextSession);
        setUser(resolvedUser);
        setIsGuest(false);
      } else if (event === 'SIGNED_OUT' || !nextSession) {
        console.log('[AuthContext] User signed out — clearing session');
        setSession(null);
        setUser(null);
        setIsGuest(false);
      }

      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    console.log('[AuthContext] login() started');

    const data = await authService.signInWithPassword(email, pass);

    if (!data.session || !data.user) {
      console.error('[AuthContext] login() failed — missing session or user in response');
      throw new Error('Authentication failed. No session was created.');
    }

    console.log('[AuthContext] Supabase session received for user:', data.user.id);
    console.log('[AuthContext] Session created — access token present:', !!data.session.access_token);

    const resolvedUser = await resolveUserFromSession(data.session);

    if (!resolvedUser) {
      console.error('[AuthContext] login() failed — could not resolve user profile');
      throw new Error('Authentication failed. Could not load user profile.');
    }

    console.log('[AuthContext] User loaded:', resolvedUser.email);
    setSession(data.session);
    setUser(resolvedUser);
    setIsGuest(false);
    console.log('[AuthContext] Authentication complete — navigating to Home');
  };

  const loginWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signUp = async (email: string, pass: string, name: string, phone: string) => {
    await authService.signUp(email, pass, name, phone);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setIsGuest(false);
    }
  };

  const continueAsGuest = () => {
    Alert.alert(
      'Sign In Required',
      'Please sign in with your email and password to access FixNest. Guest access is not available.'
    );
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const base = prev || DEFAULT_USER;
      return { ...base, ...updated };
    });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        isAuthenticated,
        login,
        loginWithGoogle,
        signUp,
        resetPassword,
        logout,
        continueAsGuest,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
