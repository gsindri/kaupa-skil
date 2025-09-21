import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { SearchSoft } from './icons-soft'

describe('SearchSoft icon', () => {
  it('centers the tinted backdrop within the view box', () => {
    const { container } = render(<SearchSoft data-testid="search-icon" />)

    const circles = Array.from(container.querySelectorAll('circle'))
    expect(circles.length).toBeGreaterThanOrEqual(1)

    const tintedCircle = circles[0]
    expect(tintedCircle?.getAttribute('cx')).toBe('12')
    expect(tintedCircle?.getAttribute('cy')).toBe('12')
  })
})
