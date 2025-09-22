export type SupplierStatus = 'connected' | 'needs_login' | 'disconnected' | 'not_connected'
export type AlertSeverity = 'high' | 'medium' | 'info'

export const supplierStatusTokens: Record<SupplierStatus, { label: string; badge: string; dot: string; tone: string }> = {
  connected: {
    label: 'Connected',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    dot: 'bg-emerald-500',
    tone: 'text-emerald-600'
  },
  needs_login: {
    label: 'Needs login',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    dot: 'bg-amber-500',
    tone: 'text-amber-600'
  },
  disconnected: {
    label: 'Disconnected',
    badge: 'bg-rose-50 text-rose-600 border-rose-200',
    dot: 'bg-rose-500',
    tone: 'text-rose-600'
  },
  not_connected: {
    label: 'Not connected',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    tone: 'text-slate-600'
  }
}

export const alertSeverityTokens: Record<AlertSeverity, { label: string; badge: string }> = {
  high: { label: 'High', badge: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  info: { label: 'Info', badge: 'bg-blue-100 text-blue-700 border-blue-200' }
}
