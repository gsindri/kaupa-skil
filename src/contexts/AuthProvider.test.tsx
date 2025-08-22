import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: { user: { id: '1', email: 'a' } } } })
        ),
        storageKey: 'test-storage-key',
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(() =>
          Promise.resolve({ data: { id: '1', email: 'a' }, error: null })
        ),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn(() =>
          Promise.resolve({ data: { id: '1', email: 'a' }, error: null })
        ),
      })),
    },
  }
})

import AuthProvider from './AuthProvider'
import { AuthContext } from './AuthProviderUtils'
import { supabase } from '@/integrations/supabase/client'

describe('AuthProvider sign-out', () => {
  it('propagates sign-out across tabs', async () => {
    const contexts: any[] = []
    const Consumer = ({ index }: { index: number }) => {
      const ctx = React.useContext(AuthContext)!
      useEffect(() => {
        contexts[index] = ctx
      }, [ctx])
      return null
    }

    render(
      <AuthProvider>
        <Consumer index={0} />
      </AuthProvider>
    )
    render(
      <AuthProvider>
        <Consumer index={1} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(contexts[0]?.user).not.toBeNull()
      expect(contexts[1]?.user).not.toBeNull()
    })

    await contexts[0].signOut()

    await waitFor(() => {
      expect(contexts[0].user).toBeNull()
      expect(contexts[1].user).toBeNull()
    })

    expect((supabase.auth.signOut as any).mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
