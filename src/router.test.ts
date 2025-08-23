import { describe, it, expect } from 'vitest'
import { routes } from './router'

const appRoute = routes.find(r => r.path === '/')
if (!appRoute) {
  throw new Error('Root route not found')
}

const childPaths = new Set(
  (appRoute.children ?? []).map(r => (r.index ? '' : r.path))
)

const expectedPaths = ['', 'catalog', 'cart', 'compare', 'suppliers', 'pantry', 'price-history', 'discovery', 'admin']

describe('sidebar route definitions', () => {
  for (const p of expectedPaths) {
    it(`includes path "${p || '/'}"`, () => {
      expect(childPaths.has(p)).toBe(true)
    })
  }
})

describe('public auth routes', () => {
  it('does not gate reset-password route', () => {
    expect(childPaths.has('reset-password')).toBe(false)
  })
  it('does not gate forgot-password route', () => {
    expect(childPaths.has('forgot-password')).toBe(false)
  })
  it('defines reset-password route', () => {
    expect(routes.some(r => r.path === '/reset-password')).toBe(true)
  })
})
