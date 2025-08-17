
import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Database } from '@/lib/types/database'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

interface ComparisonContextType {
  comparisonItems: SupplierItem[]
  addItem: (item: SupplierItem) => void
  removeItem: (item: SupplierItem) => void
  clearItems: () => void
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonItems, setComparisonItems] = useState<SupplierItem[]>([])

  const addItem = (item: SupplierItem) => {
    setComparisonItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev
      return [...prev, item]
    })
  }

  const removeItem = (item: SupplierItem) => {
    setComparisonItems(prev => prev.filter(i => i.id !== item.id))
  }

  const clearItems = () => {
    setComparisonItems([])
  }

  return (
    <ComparisonContext.Provider value={{ comparisonItems, addItem, removeItem, clearItems }}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}
