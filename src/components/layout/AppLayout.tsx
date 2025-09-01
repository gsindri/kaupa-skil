import React from 'react'
import { Outlet } from 'react-router-dom'
import { FullWidthLayout } from './FullWidthLayout'

export function AppLayout() {
  return (
    <FullWidthLayout>
      <Outlet />
    </FullWidthLayout>
  )
}
