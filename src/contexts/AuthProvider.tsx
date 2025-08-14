
import React, { createContext, useContext, useEffect, useState } from 'react'
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

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      console.log('Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }

  const refetch = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      console.log('Sign in successful')
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Attempting sign up for:', email)
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
      console.log('Sign up successful')
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('Attempting sign out')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const initializeAuth = async () => {
    try {
      console.log('AuthProvider: Initializing authentication')
      setError(null)
      
      // Check for existing session first
      console.log('Checking for existing session...')
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting initial session:', sessionError)
        setError(sessionError.message)
      } else {
        console.log('Initial session check:', initialSession ? 'Session found' : 'No session')
        
        // Set initial state
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        // Fetch profile if user exists
        if (initialSession?.user) {
          console.log('Fetching profile for initial session user')
          const profileData = await fetchProfile(initialSession.user.id)
          setProfile(profileData)
          setIsFirstTime(!profileData)
        } else {
          setProfile(null)
          setIsFirstTime(false)
        }
      }
    } catch (error) {
      console.error('Error during auth initialization:', error)
      setError(error instanceof Error ? error.message : 'Authentication initialization failed')
    } finally {
      console.log('Auth initialization complete, setting loading to false')
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state management')
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user')
        
        try {
          // Update session and user state immediately
          setSession(session)
          setUser(session?.user ?? null)
          setError(null)
          
          // Handle profile fetching for authenticated users
          if (session?.user) {
            console.log('User authenticated, fetching profile...')
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
            setIsFirstTime(!profileData)
          } else {
            console.log('User not authenticated, clearing profile')
            setProfile(null)
            setIsFirstTime(false)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
          setError(error instanceof Error ? error.message : 'Authentication error')
        }
      }
    )

    // Initialize auth state
    initializeAuth()

    // Set up timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout reached, forcing initialization')
        setLoading(false)
        setIsInitialized(true)
        setError('Authentication timeout - please refresh the page')
      }
    }, 10000) // 10 second timeout

    return () => {
      console.log('AuthProvider: Cleaning up')
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  // Log state changes for debugging
  useEffect(() => {
    console.log('Auth state update:', {
      loading,
      isInitialized,
      hasUser: !!user,
      hasSession: !!session,
      hasProfile: !!profile,
      isFirstTime,
      error
    })
  }, [loading, isInitialized, user, session, profile, isFirstTime, error])

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
