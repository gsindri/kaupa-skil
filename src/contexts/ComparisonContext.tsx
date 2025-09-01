
import React, { useState, ReactNode } from 'react'
import type { Database } from '@/lib/types'
import { ComparisonContext } from './ComparisonContextUtils'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

export default function ComparisonProvider({ children }: { children: ReactNode }) {
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
