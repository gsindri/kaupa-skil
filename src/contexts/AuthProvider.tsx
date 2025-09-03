import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session, AuthTokenResponse, AuthResponse } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { AuthContext, AuthContextType } from './AuthProviderUtils'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,tenant_id,created_at,updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (error && !(error.code === 'PGRST116' || error.message?.includes('no rows'))) {
        throw error
      }

      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({ id: userId }, { onConflict: 'id' })
          .select('id,email,full_name,tenant_id,created_at,updated_at')
          .single()
        if (createError) throw createError
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      setError(err.message)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const TEMP_SESSION_KEY = 'sb-temp-session'
  const SESSION_ACTIVE_KEY = 'sb-session-active'

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      remember = true
    ): Promise<AuthTokenResponse> => {
      setLoading(true)
      setError(null)
      try {
        // Check rate limiting for failed login attempts
        const clientIP = 'client_' + (remember ? 'remember' : 'normal') // Simple client-side rate limiting key
        const { authRateLimiter } = await import('@/lib/security')
        
        if (!authRateLimiter.isAllowed(clientIP)) {
          const error = new Error('Too many login attempts. Please try again in 15 minutes.')
          setError(error.message)
          throw error
        }
        
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (result.error) {
          // Don't reset rate limiter on error to prevent brute force
          setError(result.error.message)
          throw result.error
        }
        
        // Reset rate limiter on successful login
        authRateLimiter.reset(clientIP)
        
        if (!remember) {
          localStorage.setItem(TEMP_SESSION_KEY, 'true')
        } else {
          localStorage.removeItem(TEMP_SESSION_KEY)
        }
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true')
        return result
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<AuthResponse> => {
      setLoading(true)
      setError(null)
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        })

        if (result.error) {
          const status = (result.error as any).status
          const message = result.error.message?.toLowerCase()
          if (status === 400 || message?.includes('already registered')) {
            const err = new Error('already registered')
            setError(err.message)
            throw err
          }
          setError(result.error.message)
          throw result.error
        }

        const identities = result.data.user?.identities
        if (Array.isArray(identities) && identities.length === 0) {
          const err = new Error('already registered')
          setError(err.message)
          throw err
        }

        return result
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const resendConfirmation = useCallback(
    async (email: string): Promise<AuthResponse> => {
      setLoading(true)
      setError(null)
      try {
        const result = await supabase.auth.resend({
          type: 'signup',
          email,
        })
        if (result.error) {
          setError(result.error.message)
          throw result.error
        }
        return result
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (err: any) {
      console.error('Sign out error:', err)
      setError(err.message)
    } finally {
      try {
        const storageKey = (supabase.auth as any).storageKey
        if (storageKey) {
          localStorage.removeItem(storageKey)
          localStorage.removeItem(`${storageKey}-user`)
        }
      } catch (storageErr) {
        console.error('Failed to clear auth storage:', storageErr)
      }
      setUser(null)
      setSession(null)
      setProfile(null)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    const storageKey = (supabase.auth as any).storageKey

    const handleStorage = (event: StorageEvent) => {
      if (storageKey && event.key?.startsWith(storageKey) && event.newValue === null) {
        void signOut()
      }
    }

    window.addEventListener('storage', handleStorage)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setIsInitialized(true)
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [fetchProfile, signOut])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      profileLoading,
      isInitialized,
      error,
      refetch,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
