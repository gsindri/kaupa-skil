import { createContext, useContext } from 'react'
import { Database } from '@/lib/types/database'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

export interface ComparisonContextType {
  comparisonItems: SupplierItem[]
  addItem: (item: SupplierItem) => void
  removeItem: (item: SupplierItem) => void
  clearItems: () => void
}

export const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}
