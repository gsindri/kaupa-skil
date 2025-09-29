import React, { useMemo, useState } from 'react'
import { Search, Minus, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export interface SupplierOption {
  id: string
  name: string
  subtitle?: string | null
  logo_url?: string | null
  is_verified?: boolean | null
  status?: string | null
}

interface SupplierSelectionStepProps {
  suppliers: SupplierOption[]
  selectedIds: string[]
  onToggle: (supplierId: string) => void
  onInviteSupplier: () => void
  isLoading?: boolean
  error?: string | null
  footer: React.ReactNode
}

const FILTERS = [
  { id: 'all' },
  { id: 'connected' },
  { id: 'not_connected' }
] as const

type FilterValue = (typeof FILTERS)[number]['id']

export function SupplierSelectionStep({
  suppliers,
  selectedIds,
  onToggle,
  onInviteSupplier,
  isLoading,
  error,
  footer
}: SupplierSelectionStepProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'onboarding.steps.supplierSelection' })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const filterOptions = useMemo(
    () => FILTERS.map(option => ({ ...option, label: t(`filters.${option.id}`) })),
    [t]
  )

  const filtered = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase()
    return suppliers.filter(supplier => {
      const isSelected = selectedIds.includes(supplier.id)
      if (filter === 'connected' && !isSelected) return false
      if (filter === 'not_connected' && isSelected) return false
      if (!lowerQuery) return true
      const haystack = `${supplier.name} ${supplier.subtitle ?? ''}`.toLowerCase()
      return haystack.includes(lowerQuery)
    })
  }, [suppliers, selectedIds, query, filter])

  const makeInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length === 1) return name.slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  const renderStatusBadge = (supplier: SupplierOption, isSelected: boolean) => {
    if (supplier.status === 'paused') {
      return (
        <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-600">{t('statuses.paused')}</Badge>
      )
    }
    if (supplier.is_verified === false) {
      return (
        <Badge className="border-slate-400/40 bg-slate-400/10 text-slate-600">{t('statuses.unverified')}</Badge>
      )
    }
    if (isSelected) {
      return (
        <Badge className="border-emerald-400/40 bg-emerald-400/10 text-emerald-600">{t('statuses.connected')}</Badge>
      )
    }
    return (
      <Badge className="border-sky-400/40 bg-sky-400/10 text-sky-600">{t('statuses.verified')}</Badge>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('search.placeholder')}
              className="h-11 rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] pl-10"
            />
          </div>
          <div className="flex gap-2">
            {filterOptions.map(option => (
              <Button
                key={option.id}
                type="button"
                variant="ghost"
                onClick={() => setFilter(option.id)}
                className={`h-11 rounded-full border px-4 text-[13px] transition-colors ${
                  filter === option.id
                    ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/15 text-[color:var(--brand-accent)]'
                    : 'border-transparent text-[color:var(--text-muted)] hover:border-[var(--surface-ring)]'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-[color:var(--text-muted)]">
          {t('search.helper')}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('error.title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex h-16 animate-pulse items-center justify-between rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/20 px-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[12px] bg-[color:var(--surface-ring)]/40" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded bg-[color:var(--surface-ring)]/50" />
                  <div className="h-3 w-24 rounded bg-[color:var(--surface-ring)]/40" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-[color:var(--surface-ring)]/40" />
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map(supplier => {
            const isSelected = selectedIds.includes(supplier.id)
            return (
              <button
                type="button"
                key={supplier.id}
                onClick={() => onToggle(supplier.id)}
                className={`group flex h-16 w-full items-center justify-between gap-4 rounded-[14px] border px-4 transition-colors ${
                  isSelected
                    ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/10'
                    : 'border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] hover:border-[var(--brand-accent)]/60 hover:bg-[color:var(--surface-pop-2)]/60'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px] bg-[color:var(--surface-pop-2)]/80 text-[13px] font-semibold text-[color:var(--text-muted)]">
                    {supplier.logo_url ? (
                      <img
                        src={supplier.logo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      makeInitials(supplier.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[color:var(--text)]">{supplier.name}</p>
                    <p className="truncate text-[13px] text-[color:var(--text-muted)]">
                      {supplier.subtitle || t('cards.subtitleFallback')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStatusBadge(supplier, isSelected)}
                  <Switch
                    checked={isSelected}
                    onClick={event => event.stopPropagation()}
                    onCheckedChange={() => onToggle(supplier.id)}
                    className="data-[state=checked]:bg-[var(--brand-accent)]"
                  />
                </div>
              </button>
            )
          })
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-[color:var(--surface-ring)] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-ring)]/20 text-[color:var(--text-muted)]">
              <Minus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-[color:var(--text)]">{t('empty.title')}</p>
              <p className="text-[13px] text-[color:var(--text-muted)]">{t('empty.subtitle')}</p>
            </div>
            <Button type="button" variant="outline" onClick={onInviteSupplier} className="rounded-full">
              <Plus className="mr-2 h-4 w-4" /> {t('empty.cta')}
            </Button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-6 border-t border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/95 px-6 py-4 backdrop-blur-md md:-mx-10 md:px-10">
        {footer}
      </div>
    </div>
  )
}
