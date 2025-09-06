const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}

const CDN_BASE =
  env.VITE_CDN_URL ||
  (env.VITE_SUPABASE_URL
    ? `${env.VITE_SUPABASE_URL}/storage/v1/object/public`
    : '')

let warnedMissingCdnBase = false

/**
 * Build a full CDN URL for a cached image path.
 * Always uses our cached copy to avoid hotlinking external sources.
 * An optional fallback path can be supplied when the primary path is missing.
 */
export function getCachedImageUrl(
  path?: string | null,
  fallbackPath?: string
): string {
  if (!path) {
    if (fallbackPath) {
      console.warn('getCachedImageUrl: no path provided, using fallback')
      path = fallbackPath
    } else {
      console.warn('getCachedImageUrl: no path provided')
      return ''
    }
  }

  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!CDN_BASE) {
    if (!warnedMissingCdnBase) {
      console.warn('getCachedImageUrl: no CDN base configured')
      warnedMissingCdnBase = true
    }
    return normalizedPath
  }
  return `${CDN_BASE}${normalizedPath}`
}

