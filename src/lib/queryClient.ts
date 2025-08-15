
import { QueryClient } from '@tanstack/react-query'
import { handleQueryError, getRetryOptions, getRetryDelay } from './queryErrorHandler'

// Create optimized query client with better caching and performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests with exponential backoff
      retry: getRetryOptions,
      retryDelay: getRetryDelay,
      // Disable automatic refetching in some cases to improve performance
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Centralized error handling
      throwOnError: false, // Handle errors through onError instead
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
      onError: (error, variables, context) => {
        handleQueryError(error, 'mutation')
      },
    },
  },
})

// Global error handler for queries
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    onError: (error) => {
      handleQueryError(error, 'query')
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

// Performance monitoring
if (import.meta.env.DEV) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'success') {
      const { queryKey, dataUpdatedAt } = event.query
      console.log(`Query ${JSON.stringify(queryKey)} updated at ${new Date(dataUpdatedAt).toISOString()}`)
    }
  })
}
