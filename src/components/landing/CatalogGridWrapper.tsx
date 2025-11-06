import React from 'react'
import { CatalogShell } from '@/components/catalog/CatalogShell'

export function CatalogGridWrapper() {
  return (
    <div className="w-full">
      <CatalogShell mode="public" />
    </div>
  )
}
