
import React from 'react'
import { PriceComparisonTableNew } from '@/components/compare/PriceComparisonTableNew'

export default function Compare() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Price Comparison</h1>
        <p className="text-muted-foreground">
          Compare prices across your authorized suppliers
        </p>
      </div>
      
      <PriceComparisonTableNew />
    </div>
  )
}
