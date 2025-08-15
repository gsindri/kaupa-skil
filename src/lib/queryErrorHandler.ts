
import { toast } from 'sonner'

export interface QueryError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export const handleQueryError = (error: any, context?: string) => {
  console.error(`Query error${context ? ` in ${context}` : ''}:`, error)

  let errorMessage = 'An unexpected error occurred'
  let shouldShowToast = true

  // Handle Supabase errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        errorMessage = 'No data found'
        shouldShowToast = false // Don't show toast for "not found" errors
        break
      case 'PGRST301':
        errorMessage = 'Permission denied'
        break
      case '42501':
        errorMessage = 'Insufficient permissions'
        break
      case '23505':
        errorMessage = 'This item already exists'
        break
      case '23503':
        errorMessage = 'Referenced item not found'
        break
      case 'row_not_found':
        errorMessage = 'Item not found'
        shouldShowToast = false
        break
      default:
        errorMessage = error.message || errorMessage
    }
  } else if (error?.message) {
    errorMessage = error.message
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    errorMessage = 'Network connection error. Please check your internet connection.'
  }

  // Handle authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
    errorMessage = 'Authentication error. Please log in again.'
    // Optionally redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return
  }

  if (shouldShowToast) {
    toast.error(errorMessage, {
      description: context ? `Error in ${context}` : undefined,
      duration: 5000,
    })
  }

  return errorMessage
}

// Retry logic for failed queries
export const getRetryOptions = (failureCount: number, error: any) => {
  // Don't retry on authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
    return false
  }

  // Don't retry on client errors (4xx)
  if (error?.status >= 400 && error?.status < 500) {
    return false
  }

  // Retry up to 2 times for other errors
  return failureCount < 2
}

// Exponential backoff delay
export const getRetryDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000)
}
