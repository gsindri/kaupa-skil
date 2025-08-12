
import React from 'react'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your wholesale procurement activity
        </p>
      </div>
      
      <DashboardOverview />
    </div>
  )
}
