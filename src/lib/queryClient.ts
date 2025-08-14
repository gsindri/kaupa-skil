
import { QueryClient } from '@tanstack/react-query'

// Create optimized query client with better caching and performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Disable automatic refetching in some cases to improve performance
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
      onError: (error) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Mutation error:', error)
        }
      },
    },
  },
})

// Enhanced error handling for mutations (only in development)
if (process.env.NODE_ENV === 'development') {
  queryClient.setMutationDefaults(['supplier-items'], {
    mutationFn: async (variables: any) => {
      throw new Error('Mutation not implemented')
    },
  })
}
