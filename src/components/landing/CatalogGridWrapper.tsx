import React from 'react'
import { CatalogShell } from '@/components/catalog/CatalogShell'

export function CatalogGridWrapper() {
  return (
    <div className="w-full relative">
      <CatalogShell>
        {/* Grid content is now children of CatalogShell */}
      </CatalogShell>
    </div>
  )
}
