import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}

// CI (GitHub) sets CI=true; Vitest sets VITEST.
// In those cases, use safe dummy values if real envs aren't present.
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
