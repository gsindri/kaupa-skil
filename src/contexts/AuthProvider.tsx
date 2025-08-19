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
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>
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

  const TEMP_SESSION_KEY = 'sb-temp-session'
  const SESSION_ACTIVE_KEY = 'sb-session-active'

  const signIn = useCallback(
    async (email: string, password: string, remember = true) => {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        if (!remember) {
          localStorage.setItem(TEMP_SESSION_KEY, 'true')
        } else {
          localStorage.removeItem(TEMP_SESSION_KEY)
        }
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true')
      }
      setLoading(false)
    },
    []
  )

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
      try {
        const storageKey = (supabase.auth as any).storageKey
        if (storageKey) {
          localStorage.removeItem(storageKey)
          localStorage.removeItem(`${storageKey}-user`)
        }
        localStorage.removeItem(TEMP_SESSION_KEY)
        sessionStorage.removeItem(SESSION_ACTIVE_KEY)
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
    const tempSessionKey = TEMP_SESSION_KEY
    const sessionActiveKey = SESSION_ACTIVE_KEY

    if (!sessionStorage.getItem(sessionActiveKey) && localStorage.getItem(tempSessionKey)) {
      try {
        const storageKey = (supabase.auth as any).storageKey
        if (storageKey) {
          localStorage.removeItem(storageKey)
          localStorage.removeItem(`${storageKey}-user`)
        }
      } catch (err) {
        console.error('Failed to clear temp session on init:', err)
      }
      localStorage.removeItem(tempSessionKey)
    }

    sessionStorage.setItem(sessionActiveKey, 'true')

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
      if (event.key === storageKey) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue)
            const newSession: Session | null = parsed?.currentSession ?? null
            setSession(newSession)
            setUser(newSession?.user ?? null)
            if (newSession?.user) {
              fetchProfile(newSession.user.id)
            } else {
              setProfile(null)
            }
          } catch (err) {
            console.error('Error parsing session from storage event:', err)
          }
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
          sessionStorage.removeItem(sessionActiveKey)
        }
      }
      if (event.key === tempSessionKey && event.newValue === null) {
        sessionStorage.removeItem(sessionActiveKey)
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
