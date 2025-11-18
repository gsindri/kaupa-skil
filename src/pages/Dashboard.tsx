import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  GlassWater,
  History,
  ListChecks,
  Plus,
  Sparkles
} from 'lucide-react'

import { ContentRail } from '@/components/layout/ContentRail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'

type ActivityMetrics = {
  orders: number
  spend: string
  suppliers: number
}

type Shortcut = {
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  to?: string
  onClick?: () => void
}

const MOCK_DASHBOARD_METRICS: ActivityMetrics = {
  orders: 3,
  spend: '152.900',
  suppliers: 2
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Breakfast list', icon: ListChecks, to: '/dashboard/pantry' },
  { label: 'Bar essentials', icon: GlassWater, to: '/dashboard/discovery' },
  { label: 'Last order', icon: History, to: '/dashboard/orders' }
]

const SPARKLINE_DATA = [0, 1, 0, 3, 2, 4, 1]

export default function Dashboard() {
  const trackTelemetry = useDashboardTelemetry()

  useEffect(() => {
    trackTelemetry('dashboard_enter')
  }, [trackTelemetry])

  return (
    <div
      className="relative isolate overflow-hidden bg-[var(--surface-pop,#0f1b28)]"
      style={{ minHeight: 'calc(100vh - var(--header-h,56px))' }}
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
        <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1100px] flex-col gap-7 px-6 pb-20 pt-10 sm:pb-24 sm:pt-12">
          <OrderControlCard cartCount={12} cartTotal="84.300" />

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <MetricsCard metrics={MOCK_DASHBOARD_METRICS} sparkline={SPARKLINE_DATA} />
            <ShortcutsCard shortcuts={SHORTCUTS} />
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

function MetricsCard({ metrics, sparkline }: { metrics: ActivityMetrics; sparkline: number[] }) {
  return (
    <Card className="overflow-hidden border border-white/12 bg-[var(--surface-pop,#0f1b28)] text-ink shadow-[0_18px_44px_rgba(2,10,28,0.35)] backdrop-blur-xl lg:h-full">
      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="flex items-start justify-between text-[11px] uppercase tracking-[0.16em] text-ink-dim">
          <span>Today</span>
          <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] text-ink-hi">7 days</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile value={metrics.orders.toString()} label="ORDERS" />
          <MetricTile value={metrics.spend} label="KR SPENT" />
          <MetricTile value={metrics.suppliers.toString()} label="SUPPLIERS" />
        </div>

        <SparklineBars data={sparkline} />
      </CardContent>
    </Card>
  )
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="group rounded-2xl border border-white/14 bg-white/10 px-4 py-4 shadow-[0_14px_32px_rgba(2,10,28,0.22)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/15">
      <div className="text-2xl font-semibold leading-tight text-ink-hi sm:text-3xl">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">{label}</div>
    </div>
  )
}

function SparklineBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/8 p-3">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 12% 0%, rgba(255,255,255,0.12), transparent 30%), radial-gradient(circle at 88% 0%, rgba(46,230,214,0.16), transparent 28%)'
        }}
      />
      <div className="relative flex h-16 items-end gap-2">
        {data.map((value, index) => {
          const height = Math.max(6, (value / max) * 48)
          return (
            <div key={index} className="flex-1">
              <div
                className="mx-auto w-full max-w-[34px] rounded-full opacity-95 shadow-[0_10px_26px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  height,
                  background:
                    'linear-gradient(180deg, hsla(var(--accent) / 0.92) 0%, hsla(var(--accent) / 0.55) 55%, hsla(var(--accent) / 0.2) 100%)'
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShortcutsCard({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <Card className="overflow-hidden border border-white/12 bg-[var(--surface-pop,#0f1b28)] text-ink shadow-[0_18px_44px_rgba(2,10,28,0.35)] backdrop-blur-xl lg:h-full">
      <CardContent className="space-y-4 p-6 sm:p-7">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-ink-dim">
          <span>Shortcuts</span>
          <ChevronRight className="h-4 w-4 text-ink/60" />
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <ShortcutRow key={shortcut.label} {...shortcut} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ShortcutRow({ label, icon: Icon, to, onClick }: Shortcut) {
  const content = (
    <div className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 shadow-[0_12px_30px_rgba(2,10,28,0.2)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/14">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/12 text-ink shadow-inner shadow-black/10 transition-transform duration-200 group-hover:translate-x-0.5">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink-hi">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-ink/70 transition-transform duration-200 group-hover:translate-x-1" />
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  )
}
