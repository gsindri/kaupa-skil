// src/integrations/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}

// Safe access to Node's process.env (undefined in browser)
const nodeEnv: Record<string, any> | undefined =
  typeof process !== 'undefined' && process && 'env' in process ? (process as any).env : undefined

// Treat CI/Vitest as test envs only when running in Node
const IS_TEST = !!(nodeEnv?.CI || nodeEnv?.VITEST)
const IS_PROD = env.MODE === 'production'

const URL =
  env.VITE_SUPABASE_URL ||
  nodeEnv?.VITE_SUPABASE_URL ||
  nodeEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  (IS_TEST ? 'http://localhost:54321' : undefined)

const KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  nodeEnv?.VITE_SUPABASE_ANON_KEY ||
  nodeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (IS_TEST ? 'test-anon-key' : undefined)

// Extremely forgiving proxy that safely no-ops any method/property.
function makeChain(): any {
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'then') return undefined
      if (prop === 'unsubscribe') return () => {}
      if (prop === 'subscribe') return () => ({ unsubscribe() {} })
      if (prop === 'download') return async () => ({ data: null, error: null })
      if (prop === 'upload') return async () => ({ data: null, error: null })
      if (prop === 'remove') return async () => ({ data: null, error: null })
      if (prop === 'single') return async () => ({ data: null, error: null })
      if (prop === 'select' || prop === 'eq' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => chain
      }
      return chain
    },
    apply() {
      return chain
    },
  }
  const chain = new Proxy(() => {}, handler)
  return chain
}

function makeDummyClient(): SupabaseClient<any> {
  const chain = makeChain()
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } }, error: null } as any),
      signInWithOtp: async () => ({ data: null, error: null } as any),
      signOut: async () => ({ error: null } as any),
    } as any,
    from: () => chain,
    rpc: async () => ({ data: null, error: null } as any),
    channel: () => ({ subscribe: () => ({ unsubscribe() {} }) } as any),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null } as any),
        download: async () => ({ data: null, error: null } as any),
        remove: async () => ({ data: null, error: null } as any),
      }),
    } as any,
  } as unknown as SupabaseClient<any>
}

export const supabase: SupabaseClient<any> =
  URL && KEY
    ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : IS_PROD
      ? (() => {
          throw new Error('[Supabase] Missing env in production (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
        })()
      : (console.error(
          '[Supabase] Missing env (dev/test). Using dummy client.',
          { hasUrl: !!URL, hasKey: !!KEY, mode: env.MODE }
        ),
        makeDummyClient())
