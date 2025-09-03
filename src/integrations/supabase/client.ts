import { createClient } from '@supabase/supabase-js'

// Prefer Vite's build-time env, but fall back to values provided via public/env.js
const win: any = typeof window === 'undefined' ? undefined : window

const URL =
  import.meta.env.VITE_SUPABASE_URL || win?.__ENV__?.VITE_SUPABASE_URL
const KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  win?.__ENV__?.VITE_SUPABASE_ANON_KEY ||
  win?.__ENV__?.VITE_SUPABASE_PUBLISHABLE_KEY

if (!URL || !KEY) {
  throw new Error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY environment variables'
  )
}

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
})
