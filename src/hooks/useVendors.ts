import { useEffect, useState } from 'react'

export interface Vendor {
  id: string
  name: string
  /** optional meta like delivery info */
  meta?: string
  logo_url?: string | null
  logoUrl?: string | null
}

/**
 * Simple hook that returns connected vendors for the current user.
 * For now this reads from localStorage allowing tests to simulate
 * first-time vs connected states.
 */
export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('connected-vendors')
      if (stored) {
        setVendors(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  return { vendors }
}
