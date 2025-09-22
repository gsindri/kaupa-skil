import React from 'react'
import SuppliersPanel from './SuppliersPanel'
import AlertsPanel from './AlertsPanel'
import ActivityList from './ActivityList'
import { SpendSnapshot } from './SpendSnapshot'
import { PantryStatusCard } from './PantryStatusCard'
import { UpcomingDeliveriesCard } from './UpcomingDeliveriesCard'

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <SuppliersPanel />
        </div>
        <div className="xl:col-span-5">
          <SpendSnapshot />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <UpcomingDeliveriesCard />
        </div>
        <div className="xl:col-span-5">
          <PantryStatusCard />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-6">
          <AlertsPanel />
        </div>
        <div className="xl:col-span-6">
          <ActivityList />
        </div>
      </div>
    </div>
  )
}
