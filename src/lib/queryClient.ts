
import { QueryClient } from '@tanstack/react-query'
import { handleQueryError, getRetryOptions, getRetryDelay } from './queryErrorHandler'

// Create optimized query client with enhanced security and performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Enhanced retry with tenant-aware logic
      retry: getRetryOptions,
      retryDelay: getRetryDelay,
      // Security-focused refetch settings
      refetchOnWindowFocus: true, // Re-enabled for security updates
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Enhanced error handling
      throwOnError: false,
      // Add request deduplication
      refetchInterval: false,
      // Enhanced network mode handling
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry auth errors or permission errors
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('auth') ||
            (error as any)?.code === 'PGRST301' ||
            (error as any)?.code === '42501') {
          return false
        }
        return failureCount < 1
      },
      retryDelay: getRetryDelay,
      // Centralized mutation error handling
      onError: (error, variables, context) => {
        handleQueryError(error, 'mutation')
        
        // Log security-relevant mutation failures
        if ((error as any)?.code === 'PGRST301' || (error as any)?.code === '42501') {
          console.warn('Unauthorized mutation attempt:', {
            error: error?.message,
            variables,
            timestamp: new Date().toISOString()
          })
        }
      },
      // Network mode for mutations
      networkMode: 'online',
    },
  },
})

// Enhanced error handling for development and security monitoring
if (process.env.NODE_ENV === 'development') {
  queryClient.setMutationDefaults(['supplier-items'], {
    mutationFn: async (variables: any) => {
      throw new Error('Mutation not implemented')
    },
  })
}

// Enhanced performance and security monitoring
if (import.meta.env.DEV) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
      const { queryKey, state } = event.query
      console.log(`Query ${JSON.stringify(queryKey)} updated at ${new Date(state.dataUpdatedAt || Date.now()).toISOString()}`)
    }
    
    // Monitor for potential security issues
    if (event.type === 'updated' && event.action.type === 'error') {
      const error = event.action.error
      if ((error as any)?.code === 'PGRST301' || (error as any)?.code === '42501') {
        console.warn('Security: Unauthorized query detected:', {
          queryKey: event.query.queryKey,
          error: error?.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  })

  // Memory usage monitoring
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      const error = event.action.error
      if ((error as any)?.code === 'PGRST301' || (error as any)?.code === '42501') {
        console.warn('Security: Unauthorized mutation detected:', {
          mutationKey: event.mutation.options.mutationKey,
          error: error?.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  })
}

// Query cache cleanup for memory management
setInterval(() => {
  if (queryClient.getQueryCache().getAll().length > 1000) {
    console.warn('Query cache size exceeded 1000 entries, clearing old entries')
    queryClient.clear()
  }
}, 5 * 60 * 1000) // Check every 5 minutes
