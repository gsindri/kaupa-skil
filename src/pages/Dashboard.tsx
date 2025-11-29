import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  History,
  ListChecks,
  LucideIcon,
  Plus,

  Package,
  BarChart2,
  Loader2,
  ArrowRight
} from 'lucide-react'

import { ContentRail } from '@/components/layout/ContentRail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useKpis } from '@/hooks/useKpis'
import { useBasket } from '@/contexts/useBasket'
import { formatCurrency } from '@/lib/format'

type DashboardMetrics = {
  orders: number
  spend: string
  suppliers: number
  history: number[]
}

export default function Dashboard() {
  const trackTelemetry = useDashboardTelemetry()
  const { data: kpis, isLoading: isLoadingKpis } = useKpis()
  const basket = useBasket()

  useEffect(() => {
    trackTelemetry('dashboard_enter')
  }, [trackTelemetry])

  React.useLayoutEffect(() => {
    // Fix for "white gap" on right edge: ensure body background matches dashboard background
    const originalBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#f8fafc' // slate-50
    return () => {
      document.body.style.backgroundColor = originalBg
    }
  }, [])

  const metrics: DashboardMetrics = {
    orders: kpis?.ordersToday || 0,
    spend: formatCurrency(kpis?.spendToday || 0),
    suppliers: kpis?.suppliersCount || 0,
    history: kpis?.sparklineData || []
  }

  return (
    <div className="relative isolate overflow-hidden min-h-full">


      <ContentRail includeRailPadding={false}>
        <div className="mx-auto flex w-full flex-col gap-7">
          <OrderControlCard
            cartCount={basket.getTotalItems()}
            cartTotal={formatCurrency(basket.getTotalPrice(true))}
            isLoading={basket.isHydrating}
          />

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <DashboardMetricsCard metrics={metrics} isLoading={isLoadingKpis} />
            <DashboardShortcutsCard />
          </div>
        </div>
      </ContentRail>
    </div>
  )
}

function OrderControlCard({
  cartCount,
  cartTotal,
  isLoading
}: {
  cartCount: number
  cartTotal: string
  isLoading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Package className="h-8 w-8" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                {isLoading ? (
                  <div className="h-12 w-16 animate-pulse bg-slate-200 rounded" />
                ) : (
                  <span className="text-5xl font-bold tracking-tight text-slate-900">{cartCount}</span>
                )}
                <span className="text-lg font-medium text-slate-500">Pending Items</span>
              </div>
              <div className="mt-1 text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total Value: {isLoading ? (
                  <span className="inline-block h-4 w-24 animate-pulse bg-slate-200 rounded" />
                ) : (
                  <span className="text-slate-700">{cartTotal}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
              <Link to="/catalog">
                <Plus className="mr-2 h-5 w-5" />
                New Order
              </Link>
            </Button>

            <div className="flex gap-3">
              <Button asChild variant="outline" size="lg" className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50">
                <Link to="/dashboard/orders">
                  <History className="mr-2 h-4 w-4 text-slate-400" />
                  Last Order
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50">
                <Link to="/dashboard/pantry">
                  <ListChecks className="mr-2 h-4 w-4 text-slate-400" />
                  From List
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col leading-tight text-ink">
      <span className="text-4xl font-semibold tracking-tight text-ink-hi md:text-5xl">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">{label}</span>
    </div>
  )
}

function HeroAction({
  to,
  icon: Icon,
  label,
  onClick
}: {
  to?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick?: () => void
}) {
  const content = (
    <span className="flex items-center justify-center gap-2 px-2">
      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-active:scale-100" />
      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-hi">{label}</span>
    </span>
  )

  if (to) {
    return (
      <Button
        asChild
        variant="ghost"
        className="group h-11 rounded-full border border-white/25 bg-white/15 text-ink shadow-[0_12px_32px_rgba(1,8,20,0.32)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/25 hover:shadow-[0_18px_40px_rgba(1,8,20,0.44)]"
      >
        <Link to={to}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="group h-11 rounded-full border border-white/25 bg-white/15 text-ink shadow-[0_12px_32px_rgba(1,8,20,0.32)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/25 hover:shadow-[0_18px_40px_rgba(1,8,20,0.44)]"
      onClick={onClick}
    >
      {content}
    </Button>
  )
}

function DashboardMetricsCard({
  metrics,
  isLoading
}: {
  metrics: DashboardMetrics
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_22px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <CardContent className="flex h-[280px] items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-slate-300/70">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData = metrics.orders > 0 || metrics.suppliers > 0

  if (!hasData) {
    return (
      <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="flex h-[280px] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-slate-50 p-4">
            <BarChart2 className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">No activity yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Connect suppliers and create orders to see your metrics
            </p>
          </div>
          <Button asChild variant="default" size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
            <Link to="/suppliers">Connect Suppliers</Link>
          </Button>
        </CardContent>
      </Card>
    )

  }

  return (
    <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Activity</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-600">
            Last 7 days
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile value={metrics.orders.toString()} label="ORDERS" />
          <MetricTile value={metrics.spend} label="KR SPENT" />
          <MetricTile value={metrics.suppliers.toString()} label="SUPPLIERS" />
        </div>

        {metrics.history.length > 0 && <MetricsSparkline points={metrics.history} />}
      </CardContent>
    </Card>
  )
}

function MetricTile(props: { value: string; label: string }) {
  const { value, label } = props
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  )
}

function MetricsSparkline({ points }: { points: number[] }) {
  const safePoints = points.length ? points : [0, 0, 0, 0, 0, 0, 0]

  const path = safePoints
    .map((p, i) => {
      const x = (i / Math.max(safePoints.length - 1, 1)) * 100
      const clamped = Math.min(1, Math.max(0, p))
      const y = 100 - clamped * 70 - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full opacity-80">
      <defs>
        <linearGradient id="metrics-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#metrics-line)"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={path}
      />
    </svg>
  )
}

function DashboardShortcutsCard() {
  return (
    <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shortcuts</div>

        <div className="flex flex-col gap-2">
          <ShortcutRow to="/dashboard/lists/breakfast" icon={ListChecks} label="Breakfast list" />
          <ShortcutRow to="/dashboard/lists/bar" icon={ListChecks} label="Bar essentials" />
          <ShortcutRow to="/dashboard/orders/last" icon={History} label="Last order" />
        </div>
      </CardContent>
    </Card>
  )
}

type ShortcutRowProps = {
  to: string
  icon: LucideIcon
  label: string
}

function ShortcutRow({ to, icon: Icon, label }: ShortcutRowProps) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm border border-slate-100 group-hover:text-blue-600 group-hover:border-blue-100">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
    </Link>
  )
}
