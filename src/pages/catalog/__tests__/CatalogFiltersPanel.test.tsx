import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CatalogFiltersPanel } from '../CatalogFiltersPanel'
import { createEmptyFilters } from '@/lib/catalogFilters'

describe('CatalogFiltersPanel', () => {
  it('applies include chip and clear all', async () => {
    const onCommit = vi.fn()
    const initial = createEmptyFilters()
    render(
      <CatalogFiltersPanel
        initial={initial}
        onCommit={onCommit}
        facetData={{
          categories: [{ id: 'c1', label: 'Cat1' }],
          brands: [],
          suppliers: [],
        }}
      />
    )

    const chip = screen.getByRole('button', { name: 'Cat1' })
    await userEvent.click(chip)
    await new Promise(r => setTimeout(r, 200))
    expect(onCommit).toHaveBeenLastCalledWith({ ...initial, categories: ['c1'] })

    const clear = screen.getByText('Clear all')
    await userEvent.click(clear)
    await new Promise(r => setTimeout(r, 200))
    expect(onCommit).toHaveBeenLastCalledWith(initial)
  })
})
