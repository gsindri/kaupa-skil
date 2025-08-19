import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  isInitialized: boolean
  error: string | null
  refetch: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    })
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }, [])

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
      // Ensure local session is fully cleared to avoid rehydration
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
      if (event.key === storageKey && event.newValue === null) {
        setSession(null)
        setUser(null)
        setProfile(null)
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
  }, [fetchProfile])

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
    }}>
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
