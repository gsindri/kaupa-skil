
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Profile fetch error:', error)
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            console.log('Creating new profile for user:', userId)
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
              })
              .select()
              .maybeSingle()

            if (createError) {
              console.warn('Failed to create profile:', createError)
              return null
            }

            console.log('Profile created successfully:', newProfile)
            return newProfile
          }
        }
        return null
      }

      console.log('Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
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
      console.log('Starting sign in process...')
      setError(null)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }

      console.log('Sign in successful')
      
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error instanceof Error ? error.message : 'Sign in failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setError(null)
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
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      setIsFirstTime(false)
      
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  // Single auth state handler
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('Auth state change:', event, 'Session:', !!session, 'User:', !!session?.user)
    
    try {
      setSession(session)
      setUser(session?.user ?? null)
      setError(null)
      
      if (session?.user) {
        console.log('User authenticated, fetching profile...')
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
        setIsFirstTime(!profileData)
        console.log('Profile set:', !!profileData, 'Is first time:', !profileData)
      } else {
        console.log('No user, clearing profile state')
        setProfile(null)
        setIsFirstTime(false)
      }
    } catch (error) {
      console.error('Auth state change error:', error)
      setError(error instanceof Error ? error.message : 'Authentication error')
    }
  }, [fetchProfile])

  // Initialize auth
  useEffect(() => {
    console.log('Initializing auth...')
    let mounted = true
    
    const initAuth = async () => {
      try {
        setError(null)
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('Session error:', sessionError.message)
          setError('Failed to retrieve session')
        }
        
        if (!mounted) return
        
        console.log('Initial session:', !!initialSession, 'User:', !!initialSession?.user)
        
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        if (initialSession?.user) {
          console.log('Initial user found, fetching profile...')
          const profileData = await fetchProfile(initialSession.user.id)
          if (mounted) {
            setProfile(profileData)
            setIsFirstTime(!profileData)
            console.log('Initial profile set:', !!profileData)
          }
        } else {
          if (mounted) {
            setProfile(null)
            setIsFirstTime(false)
          }
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setError('Authentication failed to initialize')
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization complete')
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Initialize
    initAuth()

    // Timeout for initialization
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading && !isInitialized) {
        console.warn('Auth initialization timeout')
        setLoading(false)
        setIsInitialized(true)
        setError('Authentication timeout - please try refreshing')
      }
    }, 10000) // 10 second timeout

    return () => {
      mounted = false
      console.log('Cleaning up auth listeners...')
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [handleAuthStateChange, fetchProfile])

  // Debug logging for state changes
  useEffect(() => {
    console.log('Auth state updated:', {
      user: !!user,
      session: !!session,
      profile: !!profile,
      loading,
      isInitialized,
      isFirstTime,
      error: !!error
    })
  }, [user, session, profile, loading, isInitialized, isFirstTime, error])

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
