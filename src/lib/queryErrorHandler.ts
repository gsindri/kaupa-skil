
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

  // Handle tenant context errors
  if (error?.message?.includes('tenant') || error?.code === 'TENANT_ACCESS_DENIED') {
    errorMessage = 'Access denied for this organization'
    shouldShowToast = true
  }

  // Handle rate limiting
  if (error?.status === 429 || error?.code === 'RATE_LIMIT_EXCEEDED') {
    errorMessage = 'Too many requests. Please wait a moment and try again.'
    shouldShowToast = true
  }

  if (shouldShowToast) {
    toast.error(errorMessage, {
      description: context ? `Error in ${context}` : undefined,
      duration: 5000,
    })
  }

  return errorMessage
}

// Retry logic for failed queries with enhanced tenant-aware logic
export const getRetryOptions = (failureCount: number, error: any) => {
  // Don't retry on authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
    return false
  }

  // Don't retry on permission errors
  if (error?.code === 'PGRST301' || error?.code === '42501' || error?.code === 'TENANT_ACCESS_DENIED') {
    return false
  }

  // Don't retry on client errors (4xx) except rate limiting
  if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
    return false
  }

  // Don't retry on data constraint violations
  if (error?.code === '23505' || error?.code === '23503') {
    return false
  }

  // Retry up to 2 times for other errors
  return failureCount < 2
}

// Exponential backoff delay with jitter for better distribution
export const getRetryDelay = (attemptIndex: number) => {
  const baseDelay = 1000 * 2 ** attemptIndex
  const jitter = Math.random() * 1000
  return Math.min(baseDelay + jitter, 30000)
}

// Centralized query invalidation helper
export const invalidateQueriesWithPattern = (queryClient: any, pattern: string[]) => {
  return queryClient.invalidateQueries({
    predicate: (query: any) => {
      return pattern.some(p => query.queryKey.includes(p))
    }
  })
}

// Request deduplication helper
export const createDedupedQuery = (baseQueryFn: Function) => {
  const pendingRequests = new Map()
  
  return async (...args: any[]) => {
    const key = JSON.stringify(args)
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)
    }
    
    const promise = baseQueryFn(...args)
    pendingRequests.set(key, promise)
    
    try {
      const result = await promise
      pendingRequests.delete(key)
      return result
    } catch (error) {
      pendingRequests.delete(key)
      throw error
    }
  }
}
