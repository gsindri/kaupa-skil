import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: vi.fn(),
}))

import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { SuppliersPanel } from '../SuppliersPanel'

const mockUseSupplierConnections = useSupplierConnections as unknown as vi.Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliersPanel />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseSupplierConnections.mockReturnValue({ suppliers: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No suppliers connected/i)).toBeInTheDocument()
})

test('shows suppliers', () => {
  mockUseSupplierConnections.mockReturnValue({
    suppliers: [
      { id: '1', name: 'Supp', status: 'connected', last_sync: null, next_run: null },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('Supp')).toBeInTheDocument()
})
