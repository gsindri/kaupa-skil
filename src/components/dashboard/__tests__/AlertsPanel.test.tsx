import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
}))

import { useAlerts } from '@/hooks/useAlerts'
import { AlertsPanel } from '../AlertsPanel'

const mockUseAlerts = useAlerts as unknown as Mock

function renderComponent() {
  mockUseAlerts.mockReturnValue({ alerts: [], isLoading: false })
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AlertsPanel alerts={[]} isLoading={false} />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseAlerts.mockReturnValue({ alerts: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/All quiet/i)).toBeInTheDocument()
})

test('shows alerts', () => {
  const alerts = [
    { id: '1', supplier: 'Test', sku: 'SKU', summary: 'msg', severity: 'high' as const, created_at: '2024-01-01' },
  ]
  mockUseAlerts.mockReturnValue({
    alerts,
    isLoading: false,
  })
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AlertsPanel alerts={alerts} isLoading={false} />
    </QueryClientProvider>
  )
  expect(screen.getByText('Test')).toBeInTheDocument()
})
