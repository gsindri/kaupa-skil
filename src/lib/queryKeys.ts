
export const queryKeys = {
  // User and auth related queries
  user: {
    profile: (userId?: string) => ['user', 'profile', userId] as const,
    memberships: (userId?: string) => ['user', 'memberships', userId] as const,
    permissions: (userId?: string) => ['user', 'permissions', userId] as const,
  },
  
  // Tenant related queries
  tenant: {
    all: () => ['tenants'] as const,
    detail: (tenantId: string) => ['tenant', tenantId] as const,
    users: (tenantId: string) => ['tenant', tenantId, 'users'] as const,
    settings: (tenantId: string) => ['tenant', tenantId, 'settings'] as const,
  },
  
  // Categories
  categories: {
    all: () => ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (categoryId: string) => ['category', categoryId] as const,
  },

  // Product queries
  products: {
    list: (filters?: any) => ['products', filters] as const,
  },

  // Catalog queries
  catalog: {
    list: (filters?: any) => ['catalog', 'list', filters] as const,
    unmatched: () => ['catalog', 'unmatched'] as const,
  },
  
  // Supplier related queries
  suppliers: {
    all: () => ['suppliers'] as const,
    list: () => ['suppliers', 'list'] as const,
    detail: (supplierId: string) => ['supplier', supplierId] as const,
    items: (supplierId?: string, filters?: any) => ['supplier', 'items', supplierId, filters] as const,
    credentials: (supplierId: string) => ['supplier', supplierId, 'credentials'] as const,
    runs: (supplierId: string) => ['supplier', supplierId, 'runs'] as const,
  },
  
  // Order related queries
  orders: {
    all: () => ['orders'] as const,
    detail: (orderId: string) => ['order', orderId] as const,
    lines: (orderId: string) => ['order', orderId, 'lines'] as const,
    recent: () => ['orders', 'recent'] as const,
  },
  
  // Price and comparison queries
  prices: {
    quotes: (filters?: any) => ['prices', 'quotes', filters] as const,
    history: (itemId: string) => ['prices', 'history', itemId] as const,
    comparison: (filters?: any) => ['prices', 'comparison', filters] as const,
    realTime: () => ['prices', 'realTime'] as const,
  },
  
  // Admin and security queries
  admin: {
    elevations: () => ['admin', 'elevations'] as const,
    activeElevation: () => ['admin', 'activeElevation'] as const,
    supportSessions: () => ['admin', 'supportSessions'] as const,
    auditLogs: (filters?: any) => ['admin', 'auditLogs', filters] as const,
    jobs: () => ['admin', 'jobs'] as const,
    pendingActions: () => ['admin', 'pendingActions'] as const,
  },
  
  // Security monitoring queries
  security: {
    alerts: () => ['security', 'alerts'] as const,
    suspiciousElevations: () => ['security', 'suspiciousElevations'] as const,
    failedJobs: () => ['security', 'failedJobs'] as const,
    prolongedElevations: () => ['security', 'prolongedElevations'] as const,
    events: () => ['security', 'events'] as const,
    policies: () => ['security', 'policies'] as const,
    functions: () => ['security', 'functions'] as const,
  },
  
  // Connection and health queries
  connections: {
    health: () => ['connections', 'health'] as const,
    status: (supplierId: string) => ['connection', supplierId, 'status'] as const,
  },
  
  // Analytics queries
  analytics: {
    delivery: (filters?: any) => ['analytics', 'delivery', filters] as const,
    pricing: (filters?: any) => ['analytics', 'pricing', filters] as const,
    usage: () => ['analytics', 'usage'] as const,
  },

  // Dashboard queries
  dashboard: {
    alerts: () => ['dashboard', 'alerts'] as const,
    anomalies: () => ['dashboard', 'anomalies'] as const,
    suppliers: () => ['dashboard', 'suppliers'] as const,
    liveUpdates: () => ['dashboard', 'liveUpdates'] as const,
    spend: () => ['dashboard', 'spend'] as const,
    pantry: () => ['dashboard', 'pantry'] as const,
    deliveries: () => ['dashboard', 'deliveries'] as const,
  },

  // Mutation keys for optimistic updates
  mutations: {
    createOrder: () => ['mutation', 'createOrder'] as const,
    updateSupplierCredentials: () => ['mutation', 'updateSupplierCredentials'] as const,
    createElevation: () => ['mutation', 'createElevation'] as const,
    inviteUser: () => ['mutation', 'inviteUser'] as const,
  }
} as const

// Helper function to invalidate related queries
export const getInvalidationKeys = {
  afterOrderCreate: () => [
    queryKeys.orders.all(),
    queryKeys.orders.recent(),
    queryKeys.analytics.usage()
  ],
  afterUserInvite: (tenantId: string) => [
    queryKeys.tenant.users(tenantId),
    queryKeys.admin.auditLogs()
  ],
  afterCredentialsUpdate: (supplierId: string) => [
    queryKeys.suppliers.credentials(supplierId),
    queryKeys.connections.status(supplierId),
    queryKeys.connections.health()
  ],
  afterElevationChange: () => [
    queryKeys.admin.elevations(),
    queryKeys.admin.activeElevation(),
    queryKeys.security.suspiciousElevations(),
    queryKeys.security.prolongedElevations()
  ]
}
