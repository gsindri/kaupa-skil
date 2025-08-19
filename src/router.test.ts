import { describe, it, expect } from 'vitest'
import { routes } from './router'

const appRoute = routes.find(r => r.path === '/')
if (!appRoute) {
  throw new Error('Root route not found')
}

const childPaths = new Set(
  (appRoute.children ?? []).map(r => (r.index ? '' : r.path))
)

const expectedPaths = ['', 'quick-order', 'basket', 'compare', 'suppliers', 'pantry', 'price-history', 'discovery', 'admin']

describe('sidebar route definitions', () => {
  for (const p of expectedPaths) {
    it(`includes path "${p || '/'}"`, () => {
      expect(childPaths.has(p)).toBe(true)
    })
  }
})
