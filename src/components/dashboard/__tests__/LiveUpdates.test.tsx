import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useLiveUpdates', () => ({
  useLiveUpdates: vi.fn(),
}))

import { useLiveUpdates } from '@/hooks/useLiveUpdates'
import { LiveUpdates } from '../LiveUpdates'

const mockUseLiveUpdates = useLiveUpdates as unknown as Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <LiveUpdates />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseLiveUpdates.mockReturnValue({ updates: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No updates/i)).toBeInTheDocument()
})

test('shows updates', () => {
  mockUseLiveUpdates.mockReturnValue({
    updates: [
      { id: '1', type: 'run', message: 'msg', created_at: '2024-01-01' },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('msg')).toBeInTheDocument()
})
