
import React from 'react'
import { ConnectorHealthCard } from './ConnectorHealthCard'
import { RecentOrdersTable } from './RecentOrdersTable'
import { AnomaliesList } from './AnomaliesList'

const mockSuppliers = [
  {
    id: 'sup-1',
    name: 'Véfkaupmenn',
    status: 'connected' as const,
    lastSync: '2 hours ago',
    nextRun: 'Tomorrow at 09:00'
  },
  {
    id: 'sup-2',
    name: 'Heilsuhúsið',
    status: 'connected' as const,
    lastSync: '4 hours ago',
    nextRun: 'Tomorrow at 09:00'
  },
  {
    id: 'sup-3',
    name: 'Nordic Fresh',
    status: 'needs_login' as const,
    lastSync: '2 days ago',
    nextRun: 'Pending login',
    lastRunId: 'cr-123'
  }
]

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Connector Health Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Suppliers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockSuppliers.map((supplier) => (
            <ConnectorHealthCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      </div>

      {/* Recent Orders and Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable />
        <AnomaliesList />
      </div>
    </div>
  )
}
