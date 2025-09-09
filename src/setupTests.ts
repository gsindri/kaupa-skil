import '@testing-library/jest-dom/vitest'
// src/setupTests.ts
import { vi, afterAll } from 'vitest'
import { stopPerformanceLogging } from '@/lib/performance'

// Mock the Supabase client module so unit tests never hit real API
vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: null, error: null }),
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  }
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => chain),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      channel: vi.fn(() => ({ subscribe: () => ({ unsubscribe() {} }) })),
      storage: { from: vi.fn(() => ({ upload: vi.fn(), download: vi.fn(), remove: vi.fn() })) },
    },
  }
})

afterAll(() => {
  stopPerformanceLogging()
})
