"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { clearClientCaches } from '@/lib/cache-utils';

// Supabase user interface
interface SupabaseUser {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  is_verified: boolean;
  auth_provider: string;
  is_approved_for_kuppies: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to sync user with Supabase and return user data
async function syncUserToSupabase(firebaseUser: User, authProvider: 'google' | 'github' | 'email'): Promise<SupabaseUser | null> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        display_name: firebaseUser.displayName,
        photo_url: firebaseUser.photoURL,
        is_verified: firebaseUser.emailVerified,
        auth_provider: authProvider,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to sync user to Supabase:', errorData);
      return null;
    }
    
    const data = await response.json();
    console.log('User synced to Supabase successfully');
    return data.user as SupabaseUser;
  } catch (error) {
    console.error('Failed to sync user to Supabase:', error);
    return null;
  }
}

// Helper function to fetch user data from Supabase
async function fetchSupabaseUser(firebaseUid: string): Promise<SupabaseUser | null> {
  try {
    const response = await fetch(`/api/users?firebase_uid=${firebaseUid}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user as SupabaseUser | null;
  } catch (error) {
    console.error('Failed to fetch Supabase user:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const previousAuthUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const nextUid = firebaseUser?.uid ?? null;
      // Clear guest/user caches whenever identity changes (guest <-> user, or user A <-> user B).
      // Skip the first auth callback so a page refresh keeps the current identity's cache.
      if (
        previousAuthUidRef.current !== undefined &&
        previousAuthUidRef.current !== nextUid
      ) {
        clearClientCaches();
      }
      previousAuthUidRef.current = nextUid;

      setUser(firebaseUser);
      
      // Sync verified users to Supabase on auth state change and fetch user data
      if (firebaseUser && firebaseUser.emailVerified) {
        const providerId = firebaseUser.providerData[0]?.providerId;
        let provider: 'google' | 'github' | 'email' = 'email';
        if (providerId === 'google.com') {
          provider = 'google';
        } else if (providerId === 'github.com') {
          provider = 'github';
        }
        
        // Sync and get updated user data
        const syncedUser = await syncUserToSupabase(firebaseUser, provider);
        if (syncedUser) {
          setSupabaseUser(syncedUser);
        } else {
          // Fallback: try to fetch user data directly
          const fetchedUser = await fetchSupabaseUser(firebaseUser.uid);
          setSupabaseUser(fetchedUser);
        }
      } else {
        setSupabaseUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Google users are always verified, sync to Supabase
      await syncUserToSupabase(result.user, 'google');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      // GitHub users are always verified, sync to Supabase
      await syncUserToSupabase(result.user, 'github');
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Sign out the user since email is not verified
        await firebaseSignOut(auth);
        throw { code: 'auth/email-not-verified', message: 'Please verify your email before signing in. Check your inbox for the verification link.' };
      }
      
      // Sync verified user to Supabase
      await syncUserToSupabase(userCredential.user, 'email');
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Save user to Supabase (not verified yet)
      await syncUserToSupabase(userCredential.user, 'email');
      
      // Send verification email - must be done while user is still signed in
      try {
        await sendEmailVerification(userCredential.user, {
          url: window.location.origin + '/login', // Redirect URL after verification
        });
        console.log('Verification email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't throw here - account is created, just email failed
      }
      
      // Sign out after sending verification email
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail, resendVerificationEmail, resetPassword, signOut }}>
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
