import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '../types/auth';

/** Legacy local-auth key — removed so old bypass sessions cannot restore access. */
const LEGACY_LOCAL_SESSION_KEY = '@fixnest_user_session';

export async function clearLegacyLocalSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_LOCAL_SESSION_KEY);
    console.log('[Supabase Auth] Cleared legacy local session storage');
  } catch (err) {
    console.warn('[Supabase Auth] Failed to clear legacy local session:', err);
  }
}

function requireSupabaseAuth(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
  }
}

function mapSignInError(error: { message: string }): Error {
  const msg = error.message.toLowerCase();
  console.error('[Supabase Auth] signInWithPassword error:', error.message);

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return new Error('Invalid login credentials. Incorrect email or password.');
  }
  if (msg.includes('user not found')) {
    return new Error('User not found. Please check your email address or sign up.');
  }
  if (msg.includes('email not confirmed')) {
    return new Error('Email not confirmed. Please check your email for the confirmation link.');
  }
  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('connection') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed')
  ) {
    return new Error('Network error. Please check your internet connection and try again.');
  }
  if (msg.includes('invalid email')) {
    return new Error('Invalid email format. Please enter a valid email address.');
  }

  return new Error(error.message || 'Login failed. Please check your credentials.');
}

export const authService = {
  async signInWithPassword(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new Error('Please enter both email and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email format. Please enter a valid email address.');
    }

    requireSupabaseAuth();

    const normalizedEmail = email.trim();
    console.log('[Supabase Auth] Sending signInWithPassword request for:', normalizedEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    console.log('[Supabase Auth] signInWithPassword response received');
    console.log('[Supabase Auth] Session present:', !!data?.session);
    console.log('[Supabase Auth] User present:', !!data?.user);
    if (data?.user?.id) {
      console.log('[Supabase Auth] Authenticated user id:', data.user.id);
    }

    if (error) {
      throw mapSignInError(error);
    }

    if (!data?.session || !data?.user) {
      throw new Error('Authentication succeeded but no session was returned. Please try again.');
    }

    return data;
  },

  async signUp(email: string, password: string, fullName: string, phone: string) {
    if (!email || !password || !fullName) throw new Error('Please fill in all required fields.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) throw new Error('Invalid email format. Please enter a valid email address.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

    requireSupabaseAuth();

    console.log('[Supabase Auth] Registering new user:', email.trim());
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });

    if (error) {
      console.error('[Supabase Auth Error - signUp]:', error.message);
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('already exists')) {
        throw new Error('Account already exists.');
      }
      throw new Error(error.message || 'Failed to create account.');
    }

    if (data.user) {
      try {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
          created_at: new Date().toISOString(),
        });
        if (profileError) console.error('[Supabase Auth] user_profiles upsert error:', profileError.message);
        else console.log('[Supabase Auth] Profile created in user_profiles table for ID:', data.user.id);
      } catch (pe) {
        console.warn('[Supabase Auth] Failed to insert into user_profiles:', pe);
      }
    }

    return data;
  },

  async signInWithGoogle() {
    requireSupabaseAuth();

    const redirectTo =
      Platform.OS === 'web'
        ? typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost:8081'
        : 'fixnest://';

    console.log('[Supabase Auth] Initiating Google OAuth redirect to:', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });

    if (error) {
      console.error('[Supabase Auth Error - Google OAuth]:', error.message, error);
      throw new Error(error.message || 'Google authentication failed.');
    }

    if (data?.url && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = data.url;
    }

    return data;
  },

  async resetPassword(email: string) {
    requireSupabaseAuth();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'fixnest://reset-password',
    });

    if (error) {
      console.error('[Supabase Auth Error - resetPassword]:', error.message);
      throw error;
    }

    return data;
  },

  async signOut() {
    console.log('[Auth Service] Signing out user');
    await clearLegacyLocalSession();
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('[Supabase Auth Error - signOut]:', error.message);
    }
  },

  async getSession() {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Supabase Auth Error - getSession]:', error.message);
      return null;
    }
    return data.session;
  },

  async fetchProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase Auth] user_profiles query notice:', error.message);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phone: data.phone_number,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('[Supabase Auth] Exception reading user_profiles:', err);
    }

    return null;
  },

  formatUser(user: any): UserProfile | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.fullName || user.email?.split('@')[0] || 'User',
      phone: user.user_metadata?.phone || user.phone || '',
      avatarUrl: user.user_metadata?.avatar_url || user.avatarUrl,
      createdAt: user.created_at || user.createdAt,
    };
  },
};
