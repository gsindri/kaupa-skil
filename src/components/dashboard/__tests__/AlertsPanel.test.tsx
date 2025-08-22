import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
}))

import { useAlerts } from '@/hooks/useAlerts'
import { AlertsPanel } from '../AlertsPanel'

const mockUseAlerts = useAlerts as unknown as Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AlertsPanel />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseAlerts.mockReturnValue({ alerts: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No alerts/i)).toBeInTheDocument()
})

test('shows alerts', () => {
  mockUseAlerts.mockReturnValue({
    alerts: [
      { id: '1', supplier: 'Test', sku: 'SKU', summary: 'msg', severity: 'high', created_at: '2024-01-01' },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('Test')).toBeInTheDocument()
})
