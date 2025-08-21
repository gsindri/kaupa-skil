import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

vi.mock('@/hooks/useRecentOrders', () => ({
  useRecentOrders: vi.fn(),
}))

import { useRecentOrders } from '@/hooks/useRecentOrders'
import { RecentOrdersTable } from '../RecentOrdersTable'

const mockUseRecentOrders = useRecentOrders as unknown as vi.Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RecentOrdersTable />
    </QueryClientProvider>
  )
}

test('renders empty state', () => {
  mockUseRecentOrders.mockReturnValue({ orders: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No recent orders/i)).toBeInTheDocument()
})

test('renders orders', () => {
  mockUseRecentOrders.mockReturnValue({
    orders: [
      { id: '1', created_at: '2024-01-01', supplier_count: 1, total_ex_vat: 1000, status: 'sent' },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('1')).toBeInTheDocument()
})
