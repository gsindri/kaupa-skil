import React from 'react'
import { Outlet } from 'react-router-dom'
import { FullWidthLayout } from './FullWidthLayout'

/**
 * Layout for catalog pages.
 *
 * Content is rendered without width constraints.
 */
export function CatalogLayout() {
  return (
    <FullWidthLayout>
      <Outlet />
    </FullWidthLayout>
  )
}
