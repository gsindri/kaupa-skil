
import { toast } from 'sonner'
import type { QueryClient, Query } from '@tanstack/react-query'

export interface QueryError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export const handleQueryError = (error: unknown, context?: string) => {
  console.error(`Query error${context ? ` in ${context}` : ''}:`, error)

  const err = error as { message?: string; code?: string; status?: number; name?: string }

  let errorMessage = 'An unexpected error occurred'
  let shouldShowToast = true

  // Handle Supabase errors
  if (err?.code) {
    switch (err.code) {
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
        errorMessage = err.message || errorMessage
    }
  } else if (err?.message) {
    errorMessage = err.message
  }

  // Handle network errors
  if (err?.name === 'NetworkError' || err?.code === 'NETWORK_ERROR') {
    errorMessage = 'Network connection error. Please check your internet connection.'
  }

  // Handle authentication errors
  if (err?.message?.includes('JWT') || err?.message?.includes('auth')) {
    errorMessage = 'Authentication error. Please log in again.'
    // Optionally redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return
  }

  // Handle tenant context errors
  if (err?.message?.includes('tenant') || err?.code === 'TENANT_ACCESS_DENIED') {
    errorMessage = 'Access denied for this organization'
    shouldShowToast = true
  }

  // Handle rate limiting
  if (err?.status === 429 || err?.code === 'RATE_LIMIT_EXCEEDED') {
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
export const getRetryOptions = (failureCount: number, error: unknown) => {
  const err = error as { message?: string; code?: string; status?: number }
  // Don't retry on authentication errors
  if (err?.message?.includes('JWT') || err?.message?.includes('auth')) {
    return false
  }

  // Don't retry on permission errors
  if (err?.code === 'PGRST301' || err?.code === '42501' || err?.code === 'TENANT_ACCESS_DENIED') {
    return false
  }

  // Don't retry on client errors (4xx) except rate limiting
  if (err?.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
    return false
  }

  // Don't retry on data constraint violations
  if (err?.code === '23505' || err?.code === '23503') {
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
export const invalidateQueriesWithPattern = (queryClient: QueryClient, pattern: string[]) => {
  return queryClient.invalidateQueries({
    predicate: (query: Query) => {
      return pattern.some(p => query.queryKey.includes(p))
    }
  })
}

// Request deduplication helper
export const createDedupedQuery = <TArgs extends unknown[], T>(
  baseQueryFn: (...args: TArgs) => Promise<T>
) => {
  const pendingRequests = new Map<string, Promise<T>>()

  return async (...args: TArgs): Promise<T> => {
    const key = JSON.stringify(args)

    if (pendingRequests.has(key)) {
      return pendingRequests.get(key) as Promise<T>
    }

    const promise = baseQueryFn(...args)
    pendingRequests.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      pendingRequests.delete(key)
    }
  }
}
