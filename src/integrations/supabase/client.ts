// src/integrations/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
const IS_TEST = !!(process.env.CI || process.env.VITEST)

const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (IS_TEST ? 'http://localhost:54321' : undefined)

const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (IS_TEST ? 'test-anon-key' : undefined)

// --- safe dummy so the app can mount even if envs are missing ---
function makeDummyClient(): SupabaseClient<Database> {
  const noop = () => {}
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: null, error: null }),
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  }
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } }, error: null } as any),
    },
    from: () => chain,
  } as unknown as SupabaseClient<Database>
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : (console.error(
        '[Supabase] Missing env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_ANON_KEY, mode: env.MODE }
      ),
      makeDummyClient())
