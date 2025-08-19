
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
  const sessionRef = useRef<Session | null>(null)
  const profileFetchingRef = useRef(false)

  useEffect(() => {
    isInitializedRef.current = isInitialized
    errorRef.current = error
    sessionRef.current = session
  }, [isInitialized, error, session])

  // Enhanced session validation with retry mechanism
  const validateSession = useCallback(async (sessionToValidate: Session, retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 2
    
    try {
      console.log(`Validating session (attempt ${retryCount + 1})...`)
      
      if (!sessionToValidate?.access_token || !sessionToValidate?.user?.id) {
        console.error('Invalid session structure')
        return false
      }

      // Check token expiry before making request
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = sessionToValidate.expires_at
      
      if (expiresAt && now >= expiresAt) {
        console.log('Session token expired, attempting refresh...')
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error || !data.session) {
          console.error('Session refresh failed:', error?.message)
          return false
        }
        
        console.log('Session refreshed successfully')
        return true
      }

      // Verify session with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(sessionToValidate.access_token)
      
      if (error || !user) {
        if (retryCount < MAX_RETRIES && error?.message?.includes('JWT')) {
          console.log('JWT error, retrying session validation...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          return validateSession(sessionToValidate, retryCount + 1)
        }
        console.error('Session validation failed:', error?.message)
        return false
      }

      console.log('Session validation successful')
      return true
    } catch (error) {
      console.error('Session validation error:', error)
      return false
    }
  }, [])

  // Enhanced profile fetch with better session handling
  const fetchProfile = useCallback(async (userId: string, userSession: Session, retryCount = 0): Promise<Profile | null> => {
    const MAX_RETRIES = 2
    const RETRY_DELAY = 1000 * (retryCount + 1)
    const QUERY_TIMEOUT = 10000

    if (profileFetchingRef.current) {
      console.log('Profile fetch already in progress, skipping...')
      return null
    }

    try {
      profileFetchingRef.current = true
      console.log(`=== PROFILE FETCH START (Attempt ${retryCount + 1}) ===`)
      console.log('User ID:', userId)

      // Validate session before making the request
      const isSessionValid = await validateSession(userSession)
      if (!isSessionValid) {
        // Try to get a fresh session
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !freshSession) {
          throw new Error('Cannot fetch profile - session invalid and refresh failed')
        }
        userSession = freshSession
      }

      // Small delay to ensure Supabase client state synchronization
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      console.log('Making profile query...')
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), QUERY_TIMEOUT)
      })

      const queryPromise = supabase
        .from('profiles')
        .select('id,email,full_name,tenant_id,created_at,updated_at')
        .eq('id', userId)
        .maybeSingle()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      console.log('Profile query completed:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error && !(error.code === 'PGRST116' || error.message?.includes('no rows'))) {
        throw error
      }

      if (!data) {
        console.log('Profile not found, creating...')
        const userEmail = userSession?.user?.email ?? null
        const userName = (userSession?.user?.user_metadata as any)?.full_name || userEmail?.split('@')[0] || 'User'

        const createPromise = supabase
          .from('profiles')
          .upsert({ id: userId, email: userEmail, full_name: userName }, { onConflict: 'id' })
          .select('id,email,full_name,tenant_id,created_at,updated_at')
          .single()

        const createTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile creation timeout')), QUERY_TIMEOUT)
        })

        const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeout]) as any

        if (createError) {
          throw createError
        }
        
        console.log('Profile created successfully')
        return newProfile
      }

      console.log('Profile fetched successfully')
      return data
    } catch (error: any) {
      console.error('Profile fetch error:', error)

      if (retryCount < MAX_RETRIES && (
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.code === 'PGRST301'
      )) {
        console.log(`Retrying profile fetch in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchProfile(userId, userSession, retryCount + 1)
      }

      throw error
    } finally {
      profileFetchingRef.current = false
      console.log('=== PROFILE FETCH END ===')
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

  // Enhanced auth state handler with session persistence improvements
  const handleAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    console.log('=== AUTH STATE CHANGE ===')
    console.log('Event:', event)
    console.log('Session exists:', !!newSession)
    console.log('User exists:', !!newSession?.user)
    
    try {
      setError(null)
      
      // Handle session updates
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('User authenticated, fetching profile...')
        
        // Don't set loading for token refresh to avoid UI flicker
        if (event === 'SIGNED_IN') {
          setLoading(true)
        }
        
        try {
          // Ensure client state is synchronized
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const profileData = await fetchProfile(newSession.user.id, newSession)
          console.log('Profile loaded successfully:', !!profileData)
          
          setProfile(profileData)
          setIsFirstTime(!profileData?.tenant_id)
        } catch (profileError) {
          console.error('Profile fetch failed in auth handler:', profileError)
          const errorMessage = profileError instanceof Error ? profileError.message : 'Failed to load user profile'
          
          // Only set error for sign-in, not token refresh
          if (event === 'SIGNED_IN') {
            setError(errorMessage)
          }
          setProfile(null)
          setIsFirstTime(true)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state')
        setProfile(null)
        setIsFirstTime(false)
      }
    } catch (error) {
      console.error('Auth state change error:', error)
      if (event === 'SIGNED_IN') {
        setError(error instanceof Error ? error.message : 'Authentication error')
      }
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
    
    console.log('=== AUTH STATE CHANGE END ===')
  }, [fetchProfile])

  // Session persistence and auto-refresh setup
  useEffect(() => {
    console.log('=== AUTH INITIALIZATION ===')
    let mounted = true
    let initialized = false
    
    // Set up auth state listener with all events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
    
    // Initialize session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
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
        
        if (initialSession) {
          handleAuthStateChange('SIGNED_IN', initialSession)
        } else {
          handleAuthStateChange('SIGNED_OUT', null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setError('Failed to initialize authentication')
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }
    
    initializeAuth()

    // Enhanced safety timeout
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialized && !isInitializedRef.current) {
        console.warn('Auth initialization safety timeout')
        setLoading(false)
        setIsInitialized(true)
        if (!errorRef.current) {
          setError('Authentication initialization timeout')
        }
      }
    }, 20000)

    return () => {
      mounted = false
      console.log('Cleaning up auth listeners...')
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [handleAuthStateChange])

  // Enhanced cross-tab session synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('supabase.auth.token')) {
        console.log('Auth token changed in another tab, syncing...')
        
        // Debounce multiple storage events
        setTimeout(async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (!error && sessionRef.current?.access_token !== session?.access_token) {
              handleAuthStateChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
            }
          } catch (error) {
            console.error('Cross-tab sync error:', error)
          }
        }, 100)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [handleAuthStateChange])

  // Handle page visibility changes for session validation
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session && user) {
        console.log('Page became visible, validating session...')
        
        try {
          const isValid = await validateSession(session)
          if (!isValid) {
            console.log('Session invalid after page focus, refreshing...')
            const { data, error } = await supabase.auth.refreshSession()
            if (error) {
              console.error('Session refresh failed on focus:', error)
              // Let the auth state change handler deal with the invalid session
            }
          }
        } catch (error) {
          console.error('Session validation on focus failed:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session, user, validateSession])

  // Debug logging
  useEffect(() => {
    console.log('Auth state updated:', {
      user: !!user,
      userId: user?.id,
      session: !!session,
      sessionValid: session ? new Date(session.expires_at! * 1000) > new Date() : false,
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
