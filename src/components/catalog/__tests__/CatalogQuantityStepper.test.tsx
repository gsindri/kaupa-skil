import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CatalogQuantityStepper } from '../CatalogQuantityStepper'

describe('CatalogQuantityStepper', () => {
  it('ignores stale confirmations from superseded optimistic updates', () => {
    const handleChange = vi.fn()
    const handleRemove = vi.fn()

    const { rerender } = render(
      <CatalogQuantityStepper
        quantity={1}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    const incrementButton = screen.getByRole('button', {
      name: /increase quantity of test product/i,
    })

    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)

    expect(handleChange).toHaveBeenCalledWith(2)
    expect(handleChange).toHaveBeenCalledWith(3)
    expect(screen.getByText('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={2}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()

    rerender(
      <CatalogQuantityStepper
        quantity={3}
        onChange={handleChange}
        onRemove={handleRemove}
        itemLabel="Test product"
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
