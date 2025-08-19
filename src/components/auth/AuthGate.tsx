
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'
import { ExistingUserOnboarding } from '@/components/onboarding/ExistingUserOnboarding'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, session, profile, loading, isInitialized, error, refetch } = useAuth()
  const location = useLocation()
  const [profileRetryCount, setProfileRetryCount] = useState(0)
  const [showDetailedError, setShowDetailedError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

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
    profileRetryCount,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
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
            {loading ? 'Initializing...' : 'Setting up...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed to initialize and no user
  if (error && !user && !loading) {
    console.log('AuthGate - Showing auth error state:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">
            {error.includes('timeout') 
              ? 'Authentication is taking longer than expected. Please try refreshing the page.'
              : error
            }
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full"
            >
              Refresh Page
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
  if (!user && isInitialized && !loading) {
    console.log('AuthGate - Redirecting to login, no user found')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Show profile loading issue if we have a user but no profile and there's an error
  if (user && !profile && error && !loading) {
    console.log('AuthGate - Profile loading failed with error:', error)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Profile Loading Issue</h2>
          <p className="text-muted-foreground mb-4">
            {error.includes('timeout') 
              ? 'Your profile is taking longer than expected to load.'
              : `Unable to load your profile: ${error}`
            }
          </p>
          <div className="space-y-2">
            <button
              onClick={async () => {
                console.log('Retrying profile load...')
                setIsRetrying(true)
                setProfileRetryCount(prev => prev + 1)
                try {
                  await refetch()
                } catch (retryError) {
                  console.error('Profile retry failed:', retryError)
                } finally {
                  setIsRetrying(false)
                }
              }}
              disabled={isRetrying}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : `Retry Loading Profile (${profileRetryCount + 1})`}
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
                <div>Session: {session ? 'Valid' : 'Invalid'}</div>
                <div>Session Expiry: {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</div>
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
  if (user && !profile && !error) {
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
  if (user && profile && !profile.tenant_id) {
    console.log('AuthGate - User needs onboarding, no tenant_id')
    return <ExistingUserOnboarding />
  }

  // User is authenticated and has profile - show protected content
  console.log('AuthGate - User authenticated and ready, showing protected content')
  return <>{children}</>
}
