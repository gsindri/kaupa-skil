
// Centralized query key factory for better cache management
export const queryKeys = {
  // User related
  user: {
    all: ['user'] as const,
    memberships: (userId?: string) => [...queryKeys.user.all, 'memberships', userId] as const,
    permissions: (userId?: string) => [...queryKeys.user.all, 'permissions', userId] as const,
  },
  
  // Supplier related
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.suppliers.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.suppliers.all, 'detail', id] as const,
    credentials: (id: string) => [...queryKeys.suppliers.all, 'credentials', id] as const,
    items: (supplierId?: string, filters?: Record<string, any>) => 
      ['supplier-items', supplierId, filters] as const,
  },
  
  // Orders related
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.orders.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  
  // Price related
  prices: {
    all: ['prices'] as const,
    quotes: (filters?: Record<string, any>) => ['price-quotes', filters] as const,
    history: (itemId: string, timeRange?: string) => 
      [...queryKeys.prices.all, 'history', itemId, timeRange] as const,
  },
  
  // Admin related
  admin: {
    all: ['admin'] as const,
    auditLogs: (filters?: Record<string, any>) => [...queryKeys.admin.all, 'audit-logs', filters] as const,
    securityMonitoring: () => [...queryKeys.admin.all, 'security-monitoring'] as const,
    jobs: (filters?: Record<string, any>) => [...queryKeys.admin.all, 'jobs', filters] as const,
    elevations: () => [...queryKeys.admin.all, 'elevations'] as const,
    supportSessions: () => [...queryKeys.admin.all, 'support-sessions'] as const,
  },
  
  // Delivery related
  delivery: {
    all: ['delivery'] as const,
    analytics: (filters?: Record<string, any>) => [...queryKeys.delivery.all, 'analytics', filters] as const,
    optimization: (data?: Record<string, any>) => [...queryKeys.delivery.all, 'optimization', data] as const,
  }
} as const

// Helper function to invalidate related queries
export const getRelatedQueryKeys = (entity: string, id?: string) => {
  switch (entity) {
    case 'supplier':
      return [
        queryKeys.suppliers.all,
        ...(id ? [queryKeys.suppliers.detail(id), queryKeys.suppliers.items(id)] : [])
      ]
    case 'order':
      return [
        queryKeys.orders.all,
        ...(id ? [queryKeys.orders.detail(id)] : [])
      ]
    case 'user':
      return [
        queryKeys.user.all,
        ...(id ? [queryKeys.user.memberships(id), queryKeys.user.permissions(id)] : [])
      ]
    default:
      return []
  }
}
