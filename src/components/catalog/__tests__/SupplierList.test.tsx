import { render, screen, fireEvent } from '@testing-library/react'
import { SupplierList } from '@/components/suppliers/SupplierList'
import { vi } from 'vitest'

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    createSupplier: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

describe('SupplierList', () => {
  it('renders suppliers and handles selection', () => {
    const suppliers = [
      { id: '1', name: 'Supplier A', connector_type: 'generic' },
      { id: '2', name: 'Supplier B', connector_type: 'api' },
    ]
    const credentials: any[] = []
    const handleSelect = vi.fn()
    const handleRun = vi.fn()

    render(
      <SupplierList
        suppliers={suppliers}
        credentials={credentials}
        selectedSupplier={null}
        onSelectSupplier={handleSelect}
        onRunConnector={handleRun}
      />
    )

    expect(screen.getByText('Supplier A')).toBeInTheDocument()
    expect(screen.getByText('Supplier B')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Supplier A'))
    expect(handleSelect).toHaveBeenCalledWith('1')
  })
})

