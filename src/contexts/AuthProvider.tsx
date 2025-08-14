
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isInitialized: boolean
  isFirstTime: boolean
  error: string | null
  refetch: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache profile data to prevent redundant fetches
const profileCache = new Map<string, { data: Profile | null; timestamp: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent multiple concurrent profile fetches
  const fetchingProfile = useRef<string | null>(null)
  const authStateChangeTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Check cache first
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
      return cached.data
    }

    // Prevent concurrent fetches for the same user
    if (fetchingProfile.current === userId) {
      return null
    }

    try {
      fetchingProfile.current = userId
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Profile fetch failed:', error.message)
        }
        profileCache.set(userId, { data: null, timestamp: Date.now() })
        return null
      }

      // Cache the result
      profileCache.set(userId, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Profile fetch error:', error)
      }
      return null
    } finally {
      fetchingProfile.current = null
    }
  }, [])

  const refetch = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign in error:', error)
      }
      throw error
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign up error:', error)
      }
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Clear profile cache on sign out
      profileCache.clear()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign out error:', error)
      }
      throw error
    }
  }, [])

  // Debounced auth state change handler
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    // Clear existing timeout
    if (authStateChangeTimeout.current) {
      clearTimeout(authStateChangeTimeout.current)
    }

    // Debounce rapid auth state changes
    authStateChangeTimeout.current = setTimeout(async () => {
      try {
        setSession(session)
        setUser(session?.user ?? null)
        setError(null)
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
          setIsFirstTime(!profileData)
        } else {
          setProfile(null)
          setIsFirstTime(false)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth state change error:', error)
        }
        setError(error instanceof Error ? error.message : 'Authentication error')
      }
    }, 100) // 100ms debounce
  }, [fetchProfile])

  const initializeAuth = useCallback(async () => {
    try {
      setError(null)
      
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Session error:', sessionError.message)
        }
        setError('Failed to retrieve session')
      }
      
      // Set initial state even if session is null
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      
      if (initialSession?.user) {
        const profileData = await fetchProfile(initialSession.user.id)
        setProfile(profileData)
        setIsFirstTime(!profileData)
      } else {
        setProfile(null)
        setIsFirstTime(false)
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth initialization error:', error)
      }
      setError('Authentication failed to initialize')
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }, [fetchProfile])

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Initialize auth state
    initializeAuth()

    // Reduced timeout for better UX
    const loadingTimeout = setTimeout(() => {
      if (loading && !isInitialized) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Auth initialization timeout')
        }
        setLoading(false)
        setIsInitialized(true)
        setError('Authentication timeout - please try refreshing')
      }
    }, 3000) // Keep at 3s for better UX

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
      if (authStateChangeTimeout.current) {
        clearTimeout(authStateChangeTimeout.current)
      }
    }
  }, [handleAuthStateChange, initializeAuth, loading, isInitialized])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isInitialized,
      isFirstTime,
      error,
      refetch,
      signIn,
      signUp,
      signOut
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
