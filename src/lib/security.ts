import { toast } from '@/hooks/use-toast'

/**
 * Security utilities for CSRF protection and content sanitization
 */

// CSRF Token Management
const CSRF_TOKEN_KEY = 'csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get the current CSRF token from session storage
 */
export function getCSRFToken(): string {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY)
  if (!token) {
    token = generateCSRFToken()
    sessionStorage.setItem(CSRF_TOKEN_KEY, token)
  }
  return token
}

/**
 * Get CSRF headers for API requests
 */
export function getCSRFHeaders(): Record<string, string> {
  return {
    [CSRF_HEADER_NAME]: getCSRFToken()
  }
}

/**
 * Validate CSRF token from request headers
 */
export function validateCSRFToken(requestToken?: string): boolean {
  const sessionToken = sessionStorage.getItem(CSRF_TOKEN_KEY)
  return sessionToken !== null && requestToken === sessionToken
}

/**
 * Content sanitization for CSS injection prevention
 */
export function sanitizeCSS(css: string): string {
  // Remove potentially dangerous CSS content
  return css
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/@import/gi, '') // Remove @import statements
    .replace(/expression\s*\(/gi, '') // Remove IE expression()
    .replace(/behavior\s*:/gi, '') // Remove IE behavior
    .replace(/binding\s*:/gi, '') // Remove XBL binding
    .replace(/<script/gi, '') // Remove script tags
    .replace(/<\/script/gi, '') // Remove closing script tags
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate color values to prevent CSS injection
 */
export function validateColorValue(color: string): boolean {
  // Allow hex colors, rgb/rgba, hsl/hsla, and CSS variables
  const colorRegex = /^(#[0-9a-f]{3,8}|rgb\([\d\s,]+\)|rgba\([\d\s,.]+\)|hsl\([\d\s,%]+\)|hsla\([\d\s,%,.]+\)|var\(--[\w-]+\))$/i
  return colorRegex.test(color.trim())
}

/**
 * Secure error handling with user feedback
 */
export function handleSecurityError(error: Error, context: string): void {
  console.error(`Security error in ${context}:`, error)
  toast({
    title: 'Security Error',
    description: 'A security issue was detected. Please refresh the page and try again.',
    variant: 'destructive'
  })
}

/**
 * Rate limiting helper for client-side operations
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Record this attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

// Global rate limiter instance for auth operations
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes