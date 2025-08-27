import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: vi.fn(),
}))
vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ profile: { tenant_id: 't1' } })
}))

import { useAuditLogs } from '@/hooks/useAuditLogs'
import { ActivityList } from '../ActivityList'

const mockUseAuditLogs = useAuditLogs as unknown as Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ActivityList />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseAuditLogs.mockReturnValue({ auditLogs: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No recent activity/i)).toBeInTheDocument()
})

test('shows activity', () => {
  mockUseAuditLogs.mockReturnValue({
    auditLogs: [
      { id: '1', action: 'test', created_at: '2024-01-01' },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('test')).toBeInTheDocument()
})
