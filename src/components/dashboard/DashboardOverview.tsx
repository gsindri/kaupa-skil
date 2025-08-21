import React from 'react'
import SuppliersPanel from './SuppliersPanel'
import AlertsPanel from './AlertsPanel'
import LiveUpdates from './LiveUpdates'
import ActivityList from './ActivityList'

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-sm text-muted-foreground text-center py-4">
          No KPI data available
        </div>
      </div>

      {/* Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6"><SuppliersPanel /></div>
        <div className="lg:col-span-6"><LiveUpdates /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6"><AlertsPanel /></div>
        <div className="lg:col-span-6"><ActivityList /></div>
      </div>
    </div>
  )
}
