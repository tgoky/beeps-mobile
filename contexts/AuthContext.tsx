import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import * as Crypto from 'expo-crypto';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = '@beeps_onboarding_completed';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Initialize app - check auth and onboarding status
    const initializeApp = async () => {
      try {
        // Check onboarding status first
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setHasCompletedOnboarding(onboardingStatus === 'true');

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

   const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_id', userId) // ✅ Correct field name from schema
      .maybeSingle(); // Use maybeSingle() to handle "no rows" gracefully

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" - we handle that separately
      throw error;
    }
    
    if (!data) {
      // User profile doesn't exist yet
      console.log('No user profile found for supabase user:', userId);
      setUser(null);
      return;
    }
    
    // Map database fields to your User type
    setUser({
      id: data.id,
      email: data.email,
      username: data.username,
      fullName: data.full_name,
      avatar: data.avatar,
      coverImage: data.cover_image,
      bio: data.bio,
      location: data.location,
      website: data.website,
      socialLinks: data.social_links,
      primaryRole: data.primary_role,
      verified: data.verified,
      membershipTier: data.membership_tier,
      followersCount: data.followers_count,
      followingCount: data.following_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };


  const signUp = async (email: string, password: string, userData: Partial<User>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  // Create user profile in the users table
  if (data.user) {
    // Generate a UUID for the Prisma id field
    const userId = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    const { error: profileError } = await supabase.from('users').insert({
      id: userId, // Prisma's UUID
      supabase_id: data.user.id, // Link to Supabase Auth
      email,
      username: userData.username || email.split('@')[0],
      full_name: userData.fullName || '',
      primary_role: userData.primaryRole || 'ARTIST',
      verified: false,
      membership_tier: 'FREE',
      followers_count: 0,
      following_count: 0,
      created_at: now,
      updated_at: now,
    });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }
  }
};

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        hasCompletedOnboarding,
        signIn,
        signUp,
        signOut,
        resetPassword,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
