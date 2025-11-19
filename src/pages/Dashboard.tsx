import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  History,
  ListChecks,
  LucideIcon,
  Plus,
  Sparkles,
  Loader2
} from 'lucide-react'

import { ContentRail } from '@/components/layout/ContentRail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useKpis } from '@/hooks/useKpis'
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

  useEffect(() => {
    trackTelemetry('dashboard_enter')
  }, [trackTelemetry])

  const metrics: DashboardMetrics = {
    orders: kpis?.ordersToday || 0,
    spend: formatCurrency(kpis?.spendToday || 0),
    suppliers: kpis?.suppliersCount || 0,
    history: kpis?.sparklineData || []
  }

  return (
    <div
<<<<<<< HEAD
      className="relative isolate overflow-hidden bg-[var(--surface-pop,#0f1b28)]"
      style={{
        marginTop: 'calc(var(--page-top-gap,1.5rem) * -1)',
        marginBottom: 'calc(var(--page-top-gap,1.5rem) * -1)',
        paddingTop: 'calc(var(--page-top-gap,1.5rem) + 2rem)',
        paddingBottom: 'calc(var(--page-top-gap,1.5rem) + 1.5rem)',
        paddingLeft: 'var(--page-gutter,1.5rem)',
        paddingRight: 'var(--page-gutter,1.5rem)'
      }}
=======
      className="relative isolate overflow-hidden bg-[var(--surface-pop,#0f1b28)] p-6 sm:p-8"
>>>>>>> 79b2506dfca0654261ecdbc1f5afcb8e44e2d982
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 16% 18%, hsla(var(--accent) / 0.16), transparent 32%), radial-gradient(circle at 82% 6%, hsla(var(--accent) / 0.14), transparent 32%), radial-gradient(circle at 12% 22%, rgba(59,130,246,0.12), transparent 38%), radial-gradient(circle at 78% 8%, rgba(46,230,214,0.12), transparent 34%), linear-gradient(145deg, var(--brand-from), var(--brand-via), var(--brand-to))'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 40% 50%, rgba(255,255,255,0.14) 0, transparent 32%), linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.08) 68%, rgba(255,255,255,0) 100%)'
        }}
      />

      <ContentRail includeRailPadding={false}>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-7">
          <OrderControlCard cartCount={12} cartTotal="84.300" />

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <DashboardMetricsCard metrics={metrics} isLoading={isLoadingKpis} />
            <DashboardShortcutsCard />
          </div>
        </div>
      </ContentRail>
    </div>
  )
}

function OrderControlCard({ cartCount, cartTotal }: { cartCount: number; cartTotal: string }) {
  return (
    <Card
      className="relative overflow-hidden border-white/10 bg-gradient-to-br from-[var(--brand-from)] via-[var(--brand-via)] to-[var(--brand-to)] text-ink shadow-[0_28px_80px_rgba(2,10,28,0.5)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_32px_90px_rgba(2,10,28,0.6)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 32%, rgba(255,255,255,0.16), transparent 38%), radial-gradient(circle at 74% -8%, rgba(46,230,214,0.18), transparent 34%)'
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-white/10 blur-[140px]" />

      <CardContent className="relative flex flex-col gap-6 p-7 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/15 text-ink shadow-[0_10px_34px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-200 hover:scale-[1.02]">
              <Sparkles className="h-10 w-10 drop-shadow" />
            </div>

            <div className="grid grid-cols-2 gap-6 sm:gap-10">
              <HeroMetric value={cartCount.toString()} label="IN CART" />
              <HeroMetric value={cartTotal} label="TOTAL" />
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-md">
            <HeroAction to="/catalog" icon={Plus} label="NEW" />
            <HeroAction to="/dashboard/orders" icon={History} label="LAST ORDER" />
            <HeroAction to="/dashboard/pantry" icon={ListChecks} label="FROM LIST" />
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
      <Card className="relative overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_22px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <CardContent className="flex h-[280px] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-slate-800/50 p-4">
            <Sparkles className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">No activity yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Connect suppliers and create orders to see your metrics
            </p>
          </div>
          <Button asChild variant="default" size="sm">
            <Link to="/suppliers">Connect Suppliers</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_22px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300/80">
          <span>Today</span>
          <span className="rounded-full border border-slate-500/70 px-3 py-1 text-[10px] tracking-[0.18em] text-slate-200/85">
            7 days
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
    <div className="rounded-2xl bg-slate-900/80 px-4 py-3 shadow-sm shadow-black/40">
      <div className="text-xl font-semibold text-slate-50">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
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
    <Card className="relative overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_22px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300/80">Shortcuts</div>

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
      className="group flex items-center justify-between rounded-2xl bg-slate-900/80 px-4 py-3 text-sm text-slate-50 shadow-sm shadow-black/40 transition hover:-translate-y-px hover:bg-slate-900 hover:shadow-[0_18px_40px_rgba(0,0,0,0.7)]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-100">
          <Icon className="h-4 w-4" />
        </span>
        <span>{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-[1px] group-hover:text-slate-200" />
    </Link>
  )
}
