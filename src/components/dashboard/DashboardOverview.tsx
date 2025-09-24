import React from 'react'
import SuppliersPanel from './SuppliersPanel'
import ActivityList from './ActivityList'
import { UpcomingDeliveriesCard } from './UpcomingDeliveriesCard'
import { DashboardHero } from './DashboardHero'
import { AlertsPanel } from './AlertsPanel'
import { PantryStatusCard } from './PantryStatusCard'
import { useAlerts } from '@/hooks/useAlerts'
import { usePantrySignals } from '@/hooks/usePantrySignals'

export default function DashboardOverview() {
  const { alerts, isLoading: alertsLoading } = useAlerts()
  const { items: pantryItems, isLoading: pantryLoading } = usePantrySignals()

  const showAlerts = alertsLoading || alerts.length > 0
  const showPantry = pantryLoading || pantryItems.length > 0

  return (
    <div className="space-y-6">
      <DashboardHero />
      <SuppliersPanel />
      <UpcomingDeliveriesCard />
      {showPantry ? <PantryStatusCard items={pantryItems} isLoading={pantryLoading} /> : null}
      {showAlerts ? <AlertsPanel alerts={alerts} isLoading={alertsLoading} /> : null}
      <ActivityList />
      {!alertsLoading && alerts.length === 0 ? (
        <p className="text-xs text-muted-foreground">No active alerts right now.</p>
      ) : null}
      {!pantryLoading && pantryItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">We’ll suggest refills here once you’ve placed some orders.</p>
      ) : null}
    </div>
  )
}
