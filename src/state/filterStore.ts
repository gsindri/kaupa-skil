import { useAuth } from '@/contexts/useAuth'
import type { FacetFilters } from '@/services/catalog'
import { useCallback, useEffect, useState } from 'react'

export interface FilterView {
  filters: FacetFilters
  search: string
  onlyWithPrice: boolean
}

export type SavedViews = Record<string, FilterView>

function getKey(tenantId: string, userId: string) {
  return `filter-views/${tenantId}/${userId}`
}

export function useFilterStore() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id ?? 'anon'
  const userId = profile?.id ?? 'anon'
  const storageKey = getKey(tenantId, userId)

  const [savedViews, setSavedViews] = useState<SavedViews>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setSavedViews(raw ? JSON.parse(raw) : {})
    } catch {
      setSavedViews({})
    }
  }, [storageKey])

  const saveView = useCallback((name: string, view: FilterView) => {
    setSavedViews(prev => {
      const next = { ...prev, [name]: view }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const deleteView = useCallback((name: string) => {
    setSavedViews(prev => {
      const { [name]: _, ...rest } = prev
      localStorage.setItem(storageKey, JSON.stringify(rest))
      return rest
    })
  }, [storageKey])

  return { savedViews, saveView, deleteView }
}

