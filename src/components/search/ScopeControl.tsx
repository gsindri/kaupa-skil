import React from 'react'
import { SearchScope } from '@/hooks/useGlobalSearch'

interface ScopeControlProps {
  scope: SearchScope
  onChange: (s: SearchScope) => void
}

export function ScopeControl({ scope, onChange }: ScopeControlProps) {
  return (
    <select
      value={scope}
      onChange={(e) => onChange(e.target.value as SearchScope)}
      aria-label="Search scope"
      className="mr-2 h-10 rounded-full border bg-background px-2 text-sm"
    >
      <option value="all">All</option>
      <option value="products">Products</option>
      <option value="suppliers">Suppliers</option>
      <option value="orders">Orders</option>
    </select>
  )
}

