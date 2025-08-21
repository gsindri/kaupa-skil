import React from 'react'
import KpiCard from './KpiCard'
import SuppliersPanel from './SuppliersPanel'
import AlertsPanel from './AlertsPanel'
import LiveUpdates from './LiveUpdates'
import ActivityList from './ActivityList'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const kpis = [
  { title: 'Active suppliers', value: '3 / 5', delta: 2, trend: [1,2,3,4,3,4] },
  { title: 'Items available', value: '1,250', delta: -1, trend: [5,4,4,3,4,3] },
  { title: 'Open alerts', value: '7', delta: 1, trend: [1,1,2,3,2,3] },
  { title: 'Orders this week', value: '12', delta: 3, trend: [2,3,4,5,6,7] }
]

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Top Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select defaultValue="org-1">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select org" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="org-1">Org 1</SelectItem>
            <SelectItem value="org-2">Org 2</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant="outline" size="sm">Today</Button>
          <Button variant="outline" size="sm">7d</Button>
          <Button variant="outline" size="sm">30d</Button>
          <Button variant="outline" size="sm">Custom</Button>
        </div>
        <div className="flex gap-1">
          <Button variant="secondary" size="sm">All</Button>
          <Button variant="outline" size="sm">Connected</Button>
          <Button variant="outline" size="sm">Needs attention</Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
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
