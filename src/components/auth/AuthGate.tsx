import React from 'react'
import { useAuth } from '@/contexts/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, profile, loading, isInitialized } = useAuth()
  const location = useLocation()

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    const bypass = ["/reset-password", "/forgot-password"]
    if (!bypass.includes(location.pathname)) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
    return <>{children}</>
  }
  return <>{children}</>
}
