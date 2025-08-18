
import React from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'
import { ExistingUserOnboarding } from '@/components/onboarding/ExistingUserOnboarding'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, profile, loading, isInitialized, error } = useAuth()
  const location = useLocation()

  console.log('AuthGate - Current state:', { 
    user: !!user, 
    profile: !!profile, 
    loading, 
    isInitialized,
    hasError: !!error,
    currentPath: location.pathname
  })

  // Show loading while auth is initializing
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed to initialize
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('AuthGate - Redirecting to login, no user found')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wait for profile to be loaded before making decisions
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your profile...</p>
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
