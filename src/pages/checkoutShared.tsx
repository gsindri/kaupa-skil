import type { ReactNode } from 'react'
import { Copy, FileDown, Mail } from 'lucide-react'

import type { CartItem } from '@/lib/types'

export type SupplierStatus =
  | 'ready'
  | 'pricing_pending'
  | 'minimum_not_met'
  | 'draft_created'
  | 'sent'

export type SendMethod = 'default' | 'gmail' | 'outlook' | 'copy' | 'eml'

export type ContactInfo = {
  name: string
  email: string
  phone?: string
}

export interface SupplierSectionData {
  supplierId: string
  supplierName: string
  items: CartItem[]
  subtotal: number
  deliveryCost: number
  total: number
  hasUnknownPrices: boolean
  logoUrl: string | null
  initials: string
  deliverySummary: string
  deliveryDetail: string
  deliveryNextDay: string | null
  shortfallAmount: number | null
  status: SupplierStatus
  orderEmail: string | null
}

export const statusConfig: Record<
  SupplierStatus,
  { label: string; badgeClass: string; tooltip: string }
> = {
  ready: {
    label: 'Ready',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300',
    tooltip: 'All set—opens your email with a draft.',
  },
  pricing_pending: {
    label: 'Pricing pending',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300',
    tooltip: 'We’re missing prices on some items.',
  },
  minimum_not_met: {
    label: 'Minimum not met',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-300',
    tooltip: 'Add items to reach the supplier’s delivery minimum.',
  },
  draft_created: {
    label: 'Draft created',
    badgeClass:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-300',
    tooltip: 'Draft saved—check your email client and press send.',
  },
  sent: {
    label: 'Sent',
    badgeClass:
      'border-muted bg-muted text-muted-foreground dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-200/90',
    tooltip: 'Marked as sent. Supplier will reply directly.',
  },
}

export const methodLabels: Record<SendMethod, string> = {
  default: 'Default email app',
  gmail: 'Gmail Web',
  outlook: 'Outlook Web',
  copy: 'Copy to clipboard',
  eml: 'Download .eml',
}

export const methodIcons: Record<SendMethod, ReactNode> = {
  default: <Mail className="h-4 w-4" />,
  gmail: <Mail className="h-4 w-4" />,
  outlook: <Mail className="h-4 w-4" />,
  copy: <Copy className="h-4 w-4" />,
  eml: <FileDown className="h-4 w-4" />,
}

export function formatPriceISK(price: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function buildCollapsedItemLine(item: CartItem) {
  const displayName = item.displayName || item.itemName
  return `${displayName} — ${item.quantity} ${item.unit || ''}`.trim()
}
