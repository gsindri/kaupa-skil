const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}

const CDN_BASE =
  env.VITE_CDN_URL ||
  (env.VITE_SUPABASE_URL
    ? `${env.VITE_SUPABASE_URL}/storage/v1/object/public`
    : '')

/**
 * Build a full CDN URL for a cached image path.
 * Always uses our cached copy to avoid hotlinking external sources.
 */
export function getCachedImageUrl(path?: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!CDN_BASE) return path
  return `${CDN_BASE}/${path}`
}

