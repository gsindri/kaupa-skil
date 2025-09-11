import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuantityStepper } from './QuantityStepper'

describe('QuantityStepper', () => {
  it('shows trash icon and calls onRemove when quantity is 1', async () => {
    const onRemove = vi.fn()
    render(
      <QuantityStepper
        quantity={1}
        onChange={() => {}}
        label="Test item"
        onRemove={onRemove}
      />
    )
    const button = screen.getByRole('button', { name: /remove test item/i })
    expect(button.querySelector('svg.lucide-trash2')).toBeTruthy()
    await userEvent.click(button)
    expect(onRemove).toHaveBeenCalled()
  })
})
