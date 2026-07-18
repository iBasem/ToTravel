
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Profile = Database['public']['Views']['profiles']['Row']

interface UserData {
  first_name?: string;
  last_name?: string;
  role?: 'agency' | 'traveler' | 'admin';
  company_name?: string;
}

// Errors surfaced to callers come from Supabase Auth (AuthError, which extends
// Error), PostgREST (PostgrestError), or a caught exception normalized below.
type ActionError = Error | PostgrestError | null

const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)))

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: UserData) => Promise<{ error: ActionError }>
  signIn: (email: string, password: string) => Promise<{ error: ActionError }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: ActionError }>
  profileError: boolean
  retryProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  // A failed profile fetch used to strand ProtectedRoute on an infinite
  // spinner (audit AGY-12) — track it so the UI can offer a retry.
  const [profileError, setProfileError] = useState(false)

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return profileData;
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(async () => {
            if (!mounted) return
            const profileData = await fetchProfile(session.user.id);
            if (!mounted) return
            if (profileData) {
              setProfile(profileData);
              setProfileError(false);
            } else {
              setProfileError(true);
            }
          }, 100)
        } else if (!session?.user) {
          setProfile(null)
          setProfileError(false)
        }

        setLoading(false)
      }
    )

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            if (profileData) {
              setProfile(profileData);
              setProfileError(false);
            } else {
              setProfileError(true);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, userData: UserData) => {
    try {
      cleanupAuthState();

      const redirectUrl = `${window.location.origin}/`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'traveler',
            company_name: userData.company_name || ''
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      console.error('Signup exception:', err)
      return { error: toError(err) }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Signin error:', error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      console.error('Signin exception:', err)
      return { error: toError(err) }
    }
  }

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);

      cleanupAuthState();

      await supabase.auth.signOut({ scope: 'global' })

      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('No user logged in') }

    try {
      let error = null

      if (profile.role === 'traveler') {
        const travelerUpdates: Database['public']['Tables']['travelers']['Update'] = {}
        if (updates.first_name !== undefined) travelerUpdates.first_name = updates.first_name
        if (updates.last_name !== undefined) travelerUpdates.last_name = updates.last_name
        if (updates.phone !== undefined) travelerUpdates.phone = updates.phone
        if (updates.avatar_url !== undefined) travelerUpdates.avatar_url = updates.avatar_url

        const { error: travelerError } = await supabase
          .from('travelers')
          .update(travelerUpdates)
          .eq('id', user.id)

        error = travelerError
      } else if (profile.role === 'agency') {
        const agencyUpdates: Database['public']['Tables']['travel_agencies']['Update'] = {}
        if (updates.first_name !== undefined) agencyUpdates.contact_person_first_name = updates.first_name
        if (updates.last_name !== undefined) agencyUpdates.contact_person_last_name = updates.last_name
        if (updates.phone !== undefined) agencyUpdates.phone = updates.phone
        if (updates.avatar_url !== undefined) agencyUpdates.avatar_url = updates.avatar_url
        if (updates.company_name !== undefined) agencyUpdates.company_name = updates.company_name
        if (updates.company_description !== undefined) agencyUpdates.company_description = updates.company_description

        const { error: agencyError } = await supabase
          .from('travel_agencies')
          .update(agencyUpdates)
          .eq('id', user.id)

        error = agencyError
      }

      if (!error) {
        const updatedProfile = await fetchProfile(user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      }

      return { error }
    } catch (err) {
      console.error('Update profile error:', err)
      return { error: toError(err) }
    }
  }

  const retryProfile = async () => {
    if (!user?.id) return
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
      setProfileError(false)
    } else {
      setProfileError(true)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    profileError,
    retryProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
