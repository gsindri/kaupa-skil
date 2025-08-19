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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isInitializedRef = useRef(isInitialized)
  const errorRef = useRef(error)

  useEffect(() => {
    isInitializedRef.current = isInitialized
    errorRef.current = error
  }, [isInitialized, error])

  // Enhanced session validation helper
  const validateSession = useCallback(async (sessionToValidate: Session): Promise<boolean> => {
    try {
      console.log('Validating session token...')
      
      // Check if session exists and has required properties
      if (!sessionToValidate?.access_token || !sessionToValidate?.user?.id) {
        console.error('Invalid session structure:', { 
          hasAccessToken: !!sessionToValidate?.access_token,
          hasUser: !!sessionToValidate?.user,
          hasUserId: !!sessionToValidate?.user?.id
        })
        return false
      }

      // Verify the session is still valid with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(sessionToValidate.access_token)
      
      if (error || !user) {
        console.error('Session validation failed:', error?.message || 'No user returned')
        return false
      }

      console.log('Session validation successful')
      return true
    } catch (error) {
      console.error('Session validation error:', error)
      return false
    }
  }, [])

  // Enhanced profile fetch with timeout and retry
  const fetchProfile = useCallback(async (userId: string, userSession: Session, retryCount = 0): Promise<Profile | null> => {
    const MAX_RETRIES = 2
    const RETRY_DELAY = 1000 * (retryCount + 1) // 1s, 2s, 3s
    const QUERY_TIMEOUT = 10000 // 10 seconds

    try {
      console.log(`=== PROFILE FETCH START (Attempt ${retryCount + 1}) ===`)
      console.log('User ID:', userId)
      console.log('Session exists:', !!userSession)
      console.log('Access token exists:', !!userSession?.access_token)

      // Validate session before making the request
      const isSessionValid = await validateSession(userSession)
      if (!isSessionValid) {
        throw new Error('Invalid session - cannot fetch profile')
      }

      // Add a small delay to ensure Supabase client is fully synchronized
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('Making profile query...')
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), QUERY_TIMEOUT)
      })

      // Create the actual query promise
      const queryPromise = supabase
        .from('profiles')
        .select('id,email,full_name,tenant_id,created_at,updated_at')
        .eq('id', userId)
        .maybeSingle()

      // Race between query and timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      console.log('Profile query completed:', { 
        hasData: !!data, 
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message
      })

      if (error) {
        console.error('Profile fetch error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If it's specifically "no rows", fall through to creation below
        if (!(error.code === 'PGRST116' || error.message?.includes('no rows'))) {
          throw error
        }
      }

      // If we have no error but also no data, we need to create the profile
      if (!data) {
        console.log('Profile not found (no rows). Attempting to create…')
        const userEmail = userSession?.user?.email ?? null
        const userName =
          (userSession?.user?.user_metadata as any)?.full_name ||
          userEmail?.split('@')[0] ||
          'User'

        const createTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile creation timeout')), QUERY_TIMEOUT)
        })

        const createPromise = supabase
          .from('profiles')
          .upsert({ id: userId, email: userEmail, full_name: userName }, { onConflict: 'id' })
          .select('id,email,full_name,tenant_id,created_at,updated_at')
          .single()

        const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeout]) as any

        if (createError) {
          console.error('Failed to create profile:', createError)
          throw createError
        }
        
        console.log('Profile created successfully:', newProfile)
        console.log('=== PROFILE FETCH END ===')
        return newProfile
      }

      console.log('Profile fetched successfully:', data)
      console.log('=== PROFILE FETCH END ===')
      return data
    } catch (error: any) {
      console.error('=== PROFILE FETCH ERROR ===')
      console.error('Error details:', error)
      console.error('User ID:', userId)
      console.error('Session valid:', !!userSession?.access_token)
      console.error('Retry count:', retryCount)

      // Retry logic for specific errors
      if (retryCount < MAX_RETRIES && (
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.code === 'PGRST301' // Temporary auth issues
      )) {
        console.log(`Retrying profile fetch in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchProfile(userId, userSession, retryCount + 1)
      }

      throw error
    }
  }, [validateSession])

  const refetch = useCallback(async () => {
    if (user && session) {
      console.log('Manual profile refetch requested')
      try {
        const profileData = await fetchProfile(user.id, session)
        setProfile(profileData)
        setIsFirstTime(!profileData?.tenant_id)
        setError(null)
      } catch (error) {
        console.error('Manual profile refetch failed:', error)
        setError(error instanceof Error ? error.message : 'Failed to load profile')
      }
    }
  }, [user, session, fetchProfile])

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
      window.location.assign('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  // Enhanced auth state handler with better error handling
  const handleAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    console.log('=== AUTH STATE CHANGE ===')
    console.log('Event:', event)
    console.log('Session exists:', !!newSession)
    console.log('User exists:', !!newSession?.user)
    
    try {
      // Always update session and user state first
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setError(null)
      
      if (newSession?.user && event !== 'SIGNED_OUT') {
        console.log('User authenticated, fetching profile...')
        setLoading(true)
        
        try {
          // Add a small delay to ensure the auth state is fully synchronized
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const profileData = await fetchProfile(newSession.user.id, newSession)
          console.log('Profile loaded successfully:', !!profileData)
          
          setProfile(profileData)
          setIsFirstTime(!profileData?.tenant_id)
        } catch (profileError) {
          console.error('Profile fetch failed in auth handler:', profileError)
          const errorMessage = profileError instanceof Error ? profileError.message : 'Failed to load user profile'
          setError(errorMessage)
          setProfile(null)
          setIsFirstTime(true)
        }
      } else {
        console.log('No user or signed out, clearing profile state')
        setProfile(null)
        setIsFirstTime(false)
      }
    } catch (error) {
      console.error('Auth state change error:', error)
      setError(error instanceof Error ? error.message : 'Authentication error')
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
    
    console.log('=== AUTH STATE CHANGE END ===')
  }, [fetchProfile])

  // Enhanced initialization with better error handling
  useEffect(() => {
    console.log('=== AUTH INITIALIZATION ===')
    let mounted = true
    let initialized = false
    
    // Set up the auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
    
    // Get initial session with enhanced error handling
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!mounted) return
      
      if (sessionError) {
        console.warn('Initial session error:', sessionError)
        setError('Failed to retrieve session')
        setLoading(false)
        setIsInitialized(true)
        return
      }
      
      console.log('Initial session retrieved:', !!initialSession)
      initialized = true
      
      // Trigger the auth state change handler with the initial session
      if (initialSession) {
        handleAuthStateChange('SIGNED_IN', initialSession)
      } else {
        handleAuthStateChange('SIGNED_OUT', null)
      }
    })

    // Reduced safety timeout since we have better error handling now
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialized && !isInitializedRef.current) {
        console.warn('Auth initialization safety timeout')
        setLoading(false)
        setIsInitialized(true)
        if (!errorRef.current) {
          setError('Authentication initialization timeout')
        }
      }
    }, 15000) // Increased to 15 seconds to allow for retries

    return () => {
      mounted = false
      console.log('Cleaning up auth listeners...')
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [handleAuthStateChange])

  // Debug logging
  useEffect(() => {
    console.log('Auth state updated:', {
      user: !!user,
      userId: user?.id,
      session: !!session,
      profile: !!profile,
      profileTenantId: profile?.tenant_id,
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
