
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'
import { ExistingUserOnboarding } from '@/components/onboarding/ExistingUserOnboarding'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, profile, loading, isInitialized, error, refetch } = useAuth()
  const location = useLocation()
  const [profileTimeout, setProfileTimeout] = useState(false)

  console.log('AuthGate - Detailed state:', { 
    user: !!user, 
    userId: user?.id,
    profile: !!profile, 
    profileTenantId: profile?.tenant_id,
    loading, 
    isInitialized,
    hasError: !!error,
    errorMessage: error,
    currentPath: location.pathname,
    profileTimeout,
    timestamp: new Date().toISOString()
  })

  // Set timeout for profile loading
  useEffect(() => {
    if (user && !profile && !loading && isInitialized) {
      const timeout = setTimeout(() => {
        console.log('Profile loading timeout triggered')
        setProfileTimeout(true)
      }, 5000) // 5 second timeout for profile loading

      return () => clearTimeout(timeout)
    } else {
      setProfileTimeout(false)
    }
  }, [user, profile, loading, isInitialized])

  // Show loading while auth is initializing
  if (loading || !isInitialized) {
    console.log('AuthGate - Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-muted-foreground mt-2">
              Loading: {String(loading)}, Initialized: {String(isInitialized)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show error state if authentication failed to initialize
  if (error && !user) {
    console.log('AuthGate - Showing error state:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('AuthGate - Redirecting to login, no user found')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Show loading for profile with timeout handling
  if (!profile) {
    console.log('AuthGate - Waiting for profile to load, timeout:', profileTimeout)
    
    if (profileTimeout) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-6">
            <h2 className="text-xl font-semibold mb-2">Profile Loading Issue</h2>
            <p className="text-muted-foreground mb-4">Your profile is taking longer than expected to load.</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setProfileTimeout(false)
                  refetch()
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full"
              >
                Retry Loading Profile
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 w-full"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && (
              <details className="mt-4 text-xs text-left">
                <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
                <pre className="bg-muted p-2 rounded mt-2 text-xs">
                  {JSON.stringify({ user: !!user, userId: user?.id, profile: !!profile, loading, isInitialized, error }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-muted-foreground mt-2">
              User ID: {user.id}, Profile: {String(!!profile)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Check if user needs onboarding (no tenant_id)
  if (!profile.tenant_id) {
    console.log('AuthGate - User needs onboarding, no tenant_id')
    return <ExistingUserOnboarding />
  }

  console.log('AuthGate - User authenticated and ready, showing protected content')
  return <>{children}</>
}
