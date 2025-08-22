import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
const IS_TEST = !!(process.env.CI || process.env.VITEST)

const URL =
  env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (IS_TEST ? 'http://localhost:54321' : undefined)

const KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (IS_TEST ? 'test-anon-key' : undefined)

// Extremely forgiving proxy that safely no-ops any method/property.
// Prevents TypeErrors like "x is not a function" if app calls rpc(), channel(), storage(), etc.
function makeChain(): any {
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'then') return undefined // don't act like a Promise
      if (prop === 'unsubscribe') return () => {}
      if (prop === 'subscribe') return () => ({ unsubscribe() {} })
      if (prop === 'download') return async () => ({ data: null, error: null })
      if (prop === 'upload') return async () => ({ data: null, error: null })
      if (prop === 'remove') return async () => ({ data: null, error: null })
      if (prop === 'single') return async () => ({ data: null, error: null })
      if (prop === 'select' || prop === 'eq' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => chain
      }
      // default: return chainable fn
      return chain
    },
    apply() {
      return chain
    },
  }
  const chain = new Proxy(() => {}, handler)
  return chain
}

function makeDummyClient(): SupabaseClient<Database> {
  const chain = makeChain()
  return {
    // minimal auth surface so providers relying on it don't explode
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } }, error: null } as any),
      signInWithOtp: async () => ({ data: null, error: null } as any),
      signOut: async () => ({ error: null } as any),
    } as any,
    from: () => chain,
    rpc: async () => ({ data: null, error: null } as any),
    channel: () => ({ subscribe: () => ({ unsubscribe() {} }) } as any),
    storage: { from: () => ({ upload: async () => ({ data: null, error: null } as any), download: async () => ({ data: null, error: null } as any), remove: async () => ({ data: null, error: null } as any) }) } as any,
  } as unknown as SupabaseClient<Database>
}

export const supabase: SupabaseClient<Database> =
  URL && KEY
    ? createClient<Database>(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : (console.error(
        '[Supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        { hasUrl: !!URL, hasKey: !!KEY, mode: env.MODE }
      ),
      makeDummyClient())
