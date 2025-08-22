export type SupplierStatus = 'connected' | 'needs_login' | 'disconnected'
export type AlertSeverity = 'high' | 'medium' | 'low'

export const supplierStatusTokens: Record<SupplierStatus, { label: string; badge: string }> = {
  connected: { label: 'Connected', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  needs_login: { label: 'Needs login', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  disconnected: { label: 'Disconnected', badge: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export const alertSeverityTokens: Record<AlertSeverity, { label: string; badge: string }> = {
  high: { label: 'High', badge: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
}
