import { createContext } from 'react'
import { Database } from '@/lib/types/database'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

export interface ComparisonContextType {
  comparisonItems: SupplierItem[]
  addItem: (item: SupplierItem) => void
  removeItem: (item: SupplierItem) => void
  clearItems: () => void
}

export const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)
