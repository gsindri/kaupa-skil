import React from 'react'
import { AppLayout } from './AppLayout'

export function FullWidthLayout({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) {
  return <AppLayout header={header}>{children}</AppLayout>
}

export default FullWidthLayout
