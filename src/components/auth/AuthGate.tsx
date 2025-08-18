
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
  const [profileRetryCount, setProfileRetryCount] = useState(0)
  const [showDetailedError, setShowDetailedError] = useState(false)

  console.log('AuthGate state:', { 
    user: !!user, 
    userId: user?.id,
    profile: !!profile, 
    profileTenantId: profile?.tenant_id,
    loading, 
    isInitialized,
    hasError: !!error,
    errorMessage: error,
    currentPath: location.pathname,
    profileRetryCount
  })

  // Show loading while auth is initializing
  if (loading || !isInitialized) {
    console.log('AuthGate - Showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Loading: {String(loading)}, Initialized: {String(isInitialized)}
          </p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed to initialize
  if (error && !user) {
    console.log('AuthGate - Showing auth error state:', error)
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

  // Show profile loading issue if we have a user but no profile and there's an error
  if (!profile && error) {
    console.log('AuthGate - Profile loading failed with error:', error)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Profile Loading Issue</h2>
          <p className="text-muted-foreground mb-4">
            {error.includes('timeout') 
              ? 'Your profile is taking longer than expected to load.'
              : `Failed to load your profile: ${error}`
            }
          </p>
          <div className="space-y-2">
            <button
              onClick={async () => {
                console.log('Retrying profile load...')
                setProfileRetryCount(prev => prev + 1)
                try {
                  await refetch()
                } catch (retryError) {
                  console.error('Profile retry failed:', retryError)
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full"
            >
              Retry Loading Profile (Attempt {profileRetryCount + 1})
            </button>
            <button
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 w-full"
            >
              {showDetailedError ? 'Hide' : 'Show'} Details
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 w-full"
            >
              Refresh Page
            </button>
          </div>
          
          {showDetailedError && (
            <details className="mt-4 text-xs text-left">
              <summary className="cursor-pointer text-muted-foreground mb-2">Debug Information</summary>
              <div className="bg-muted p-3 rounded text-xs space-y-1">
                <div>User ID: {user?.id}</div>
                <div>Session: {user ? 'Valid' : 'Invalid'}</div>
                <div>Profile: {profile ? 'Loaded' : 'Not loaded'}</div>
                <div>Error: {error}</div>
                <div>Retry Count: {profileRetryCount}</div>
                <div>Loading: {String(loading)}</div>
                <div>Initialized: {String(isInitialized)}</div>
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  // Show simple loading for profile (without error)
  if (!profile && !error) {
    console.log('AuthGate - Waiting for profile to load')
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
          <p className="text-xs text-muted-foreground mt-2">
            This should only take a moment
          </p>
        </div>
      </div>
    )
  }

  // Check if user needs onboarding (no tenant_id)
  if (profile && !profile.tenant_id) {
    console.log('AuthGate - User needs onboarding, no tenant_id')
    return <ExistingUserOnboarding />
  }

  console.log('AuthGate - User authenticated and ready, showing protected content')
  return <>{children}</>
}
