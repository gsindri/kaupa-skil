import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

vi.mock('@/hooks/usePriceAnomalies', () => ({
  usePriceAnomalies: vi.fn(),
}))

import { usePriceAnomalies } from '@/hooks/usePriceAnomalies'
import { AnomaliesList } from '../AnomaliesList'

const mockUsePriceAnomalies = usePriceAnomalies as unknown as vi.Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AnomaliesList />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUsePriceAnomalies.mockReturnValue({ anomalies: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No anomalies found/i)).toBeInTheDocument()
})

test('shows anomalies', () => {
  mockUsePriceAnomalies.mockReturnValue({
    anomalies: [
      { id: '1', type: 'price_spike', item: 'Item', supplier: 'Supp', description: 'desc', impact: 'high', created_at: '2024-01-01' },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('Item')).toBeInTheDocument()
})
