import React from 'react'
import { renderHook, act } from '@testing-library/react'

import SettingsProvider from './SettingsProvider'
import { useSettings } from './useSettings'

describe('SettingsProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back gracefully when BroadcastChannel is unavailable', () => {
    const hadBroadcastChannel = 'BroadcastChannel' in globalThis
    const originalBroadcastChannel = (globalThis as typeof globalThis & {
      BroadcastChannel?: typeof BroadcastChannel
    }).BroadcastChannel

    ;(globalThis as typeof globalThis & { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel =
      undefined

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    )

    try {
      const { result } = renderHook(() => useSettings(), { wrapper })

      act(() => {
        result.current.setIncludeVat(true)
      })

      expect(result.current.includeVat).toBe(true)
      expect(localStorage.getItem('procurewise-include-vat')).toBe(JSON.stringify(true))

      act(() => {
        result.current.setPreferredUnit('kg')
      })

      expect(result.current.preferredUnit).toBe('kg')
      expect(localStorage.getItem('procurewise-preferred-unit')).toBe('kg')

      act(() => {
        result.current.setUserMode('analytical')
      })

      expect(result.current.userMode).toBe('analytical')
      expect(localStorage.getItem('procurewise-user-mode')).toBe('analytical')
    } finally {
      if (hadBroadcastChannel) {
        ;(globalThis as typeof globalThis & { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel =
          originalBroadcastChannel
      } else {
        delete (globalThis as typeof globalThis & { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel
      }
    }
  })
})

