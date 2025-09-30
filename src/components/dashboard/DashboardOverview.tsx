import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Factory, LineChart, PiggyBank, Truck, Users2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { usePantrySignals } from '@/hooks/usePantrySignals'
import { useSpendSnapshot } from '@/hooks/useSpendSnapshot'
import { useUpcomingDeliveries } from '@/hooks/useUpcomingDeliveries'
import { useAlerts } from '@/hooks/useAlerts'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { useAuth } from '@/contexts/useAuth'
import { formatCurrency } from '@/lib/format'
import { differenceInCalendarDays, format } from 'date-fns'
import { getNextDeliveryDate } from './delivery-helpers'
import { cn } from '@/lib/utils'

type BadgeVariant = React.ComponentProps<typeof Badge>['variant']

interface CategoryStatus {
  label: string
  variant?: BadgeVariant
  isLoading?: boolean
}

interface CategoryAction {
  label: string
  description?: string
  to: string
}

interface DashboardCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accentClass: string
  status: CategoryStatus
  actions: CategoryAction[]
}

function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  if (status.isLoading) {
    return <Skeleton className="h-6 w-32 rounded-full bg-muted" />
  }

  return status.label ? (
    <Badge variant={status.variant ?? 'secondary'}>{status.label}</Badge>
  ) : null
}

function DashboardCategoryCard({
  title,
  description,
  icon: Icon,
  accentClass,
  status,
  actions,
}: DashboardCategory) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-none bg-gradient-to-br from-background/80 via-background/60 to-background/40 shadow-sm',
        accentClass
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/30 to-transparent" aria-hidden="true" />
      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {title}
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          </div>
          <CategoryStatusBadge status={status} />
        </div>

        <div className="mt-6 flex flex-1 flex-col justify-end gap-2">
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group/action flex items-center justify-between gap-4 rounded-lg border border-transparent bg-background/80 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                {action.description ? (
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                ) : null}
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover/action:translate-x-1 group-hover/action:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function DashboardOverview() {
  const { profile } = useAuth()
  const { suppliers, isLoading: suppliersLoading } = useSupplierConnections()
  const { items: pantryItems, isLoading: pantryLoading } = usePantrySignals()
  const { data: spendData, isLoading: spendLoading } = useSpendSnapshot()
  const { rules: deliveryRules, isLoading: deliveriesLoading } = useUpcomingDeliveries()
  const { alerts, isLoading: alertsLoading } = useAlerts()
  const { auditLogs = [], isLoading: auditLoading } = useAuditLogs({ tenantId: profile?.tenant_id })

  const referenceDate = useMemo(() => new Date(), [])

  const { needsAttention, connectedSuppliers } = useMemo(() => {
    const connected = suppliers.filter((s) => s.status === 'connected').length
    const needsHelp = suppliers.filter((s) => s.status === 'needs_login' || s.status === 'disconnected').length

    return { connectedSuppliers: connected, needsAttention: needsHelp }
  }, [suppliers])

  const deliveriesSummary = useMemo(() => {
    const deliveriesDue = deliveryRules.reduce((count, rule) => {
      const next = getNextDeliveryDate(rule.delivery_days, rule.cutoff_time, referenceDate)
      if (!next) return count
      const diff = differenceInCalendarDays(next, referenceDate)
      if (diff < 0 || diff > 7) return count
      return count + 1
    }, 0)

    const nextDeliveryDate = deliveryRules
      .map((rule) => getNextDeliveryDate(rule.delivery_days, rule.cutoff_time, referenceDate))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return { deliveriesDue, nextDeliveryDate }
  }, [deliveryRules, referenceDate])

  const teamInsights = useMemo(() => {
    const weekAgo = new Date(referenceDate)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const orders = auditLogs.filter((log: any) =>
      typeof log.action === 'string' && (log.action.includes('order') || log.entity_type === 'order')
    )

    const ordersThisWeek = orders.filter((log: any) => {
      const createdAt = log.created_at ? new Date(log.created_at) : null
      return createdAt ? createdAt >= weekAgo : false
    }).length

    const uniqueUsers = new Set(
      auditLogs
        .map((log: any) => log.actor_id)
        .filter(Boolean)
    ).size

    const lastActivity = auditLogs[0]?.created_at ? new Date(auditLogs[0].created_at) : null

    return { ordersThisWeek, uniqueUsers, lastActivity }
  }, [auditLogs, referenceDate])

  const categories: DashboardCategory[] = useMemo(() => {
    const supplierStatus: CategoryStatus = suppliersLoading
      ? { label: 'Checking connections…', isLoading: true }
      : suppliers.length === 0
        ? { label: 'Add your first supplier', variant: 'secondary' }
        : needsAttention > 0
          ? { label: `${needsAttention} need reconnecting`, variant: 'destructive' }
          : { label: `${connectedSuppliers} supplier${connectedSuppliers === 1 ? '' : 's'} synced`, variant: 'default' }

    const pantryStatus: CategoryStatus = pantryLoading
      ? { label: 'Scanning pantry…', isLoading: true }
      : pantryItems.length > 0
        ? { label: `${pantryItems.length} flagged for reorder`, variant: 'default' }
        : { label: 'Nothing needs topping up', variant: 'secondary' }

    const spendStatus: CategoryStatus = spendLoading
      ? { label: 'Calculating spend…', isLoading: true }
      : spendData && spendData.thisWeek > 0
        ? {
            label: `${formatCurrency(spendData.thisWeek)} this week`,
            variant: spendData.change > 15 ? 'destructive' : 'default',
          }
        : { label: 'Awaiting your first order', variant: 'secondary' }

    const deliveriesStatus: CategoryStatus = deliveriesLoading
      ? { label: 'Syncing schedule…', isLoading: true }
      : deliveriesSummary.deliveriesDue > 0
        ? {
            label: `${deliveriesSummary.deliveriesDue} due within 7 days`,
            variant: 'default',
          }
        : { label: 'No deliveries scheduled', variant: 'secondary' }

    const teamStatus: CategoryStatus = auditLoading
      ? { label: 'Reviewing activity…', isLoading: true }
      : teamInsights.uniqueUsers > 0
        ? {
            label: `${teamInsights.uniqueUsers} active this week`,
            variant: 'default',
          }
        : { label: 'Invite your team', variant: 'secondary' }

    const analyticsStatus: CategoryStatus = alertsLoading
      ? { label: 'Gathering insights…', isLoading: true }
      : alerts.length > 0
        ? { label: `${alerts.length} alerts waiting`, variant: 'destructive' }
        : spendData?.categories?.length
          ? {
              label: `${spendData.categories[0].name} leading spend`,
              variant: 'default',
            }
          : { label: 'Insights will appear soon', variant: 'secondary' }

    return [
      {
        id: 'suppliers',
        title: 'Suppliers',
        description: 'Keep integrations healthy and surface the best partner offers in one place.',
        icon: Factory,
        accentClass: 'from-orange-500/10 via-orange-500/5 to-background/30',
        status: supplierStatus,
        actions: [
          {
            label: 'Manage suppliers',
            description: suppliers.length > 0
              ? 'Review connections and add new partners.'
              : 'Set up supplier integrations to unlock live data.',
            to: '/suppliers',
          },
          {
            label: 'Reconnect integrations',
            description: needsAttention > 0
              ? `${needsAttention} supplier${needsAttention === 1 ? '' : 's'} need a login refresh.`
              : 'All integrations are currently healthy.',
            to: '/suppliers',
          },
          {
            label: 'See special offers',
            description: 'Browse promotions from connected suppliers.',
            to: '/discovery',
          },
        ],
      },
      {
        id: 'pantry',
        title: 'Pantry',
        description: 'Spot low stock items before they run out and keep shelves organised.',
        icon: ClipboardList,
        accentClass: 'from-emerald-500/10 via-emerald-500/5 to-background/30',
        status: pantryStatus,
        actions: [
          {
            label: 'Check low stock items',
            description: pantryItems.length > 0
              ? `${pantryItems.length} item${pantryItems.length === 1 ? '' : 's'} need attention.`
              : 'We’ll highlight reorder suggestions here.',
            to: '/pantry',
          },
          {
            label: 'Expiry watch',
            description: 'Track best-before dates to avoid waste.',
            to: '/pantry',
          },
          {
            label: 'Flagged for reorder',
            description: pantryItems.length > 0
              ? 'Review the latest reorder signals now.'
              : 'Signals will appear once orders are flowing.',
            to: '/pantry',
          },
        ],
      },
      {
        id: 'spend',
        title: 'Spend & budgets',
        description: 'Keep an eye on weekly spend and stay within your plan.',
        icon: PiggyBank,
        accentClass: 'from-sky-500/10 via-sky-500/5 to-background/30',
        status: spendStatus,
        actions: [
          {
            label: "This week's spend",
            description: spendData && spendData.thisWeek > 0
              ? `${formatCurrency(spendData.thisWeek)} so far with ${spendData.ordersThisWeek} order${spendData.ordersThisWeek === 1 ? '' : 's'}.`
              : 'Place an order to start tracking budgets.',
            to: '/orders',
          },
          {
            label: 'Compare vs last week',
            description: spendData && spendData.lastWeek > 0
              ? `${spendData.change >= 0 ? '+' : ''}${spendData.change.toFixed(1)}% change week over week.`
              : 'We’ll compare your spend once data is available.',
            to: '/orders',
          },
          {
            label: 'Alerts for over-budget',
            description: 'Set notification rules to stay on target.',
            to: '/settings',
          },
        ],
      },
      {
        id: 'deliveries',
        title: 'Deliveries',
        description: 'Know what is arriving and plan your receiving crew in advance.',
        icon: Truck,
        accentClass: 'from-purple-500/10 via-purple-500/5 to-background/30',
        status: deliveriesStatus,
        actions: [
          {
            label: "Today's deliveries",
            description: deliveriesSummary.deliveriesDue > 0
              ? 'Review today’s drop-offs and prepare receiving.'
              : 'No deliveries expected today.',
            to: '/delivery',
          },
          {
            label: 'Next 7 days',
            description: deliveriesSummary.nextDeliveryDate
              ? `Next arrival on ${format(deliveriesSummary.nextDeliveryDate, 'EEEE, MMM d')}.`
              : 'Set delivery windows to build the schedule.',
            to: '/delivery',
          },
          {
            label: 'Set delivery windows',
            description: 'Adjust supplier cut-offs and drop slots.',
            to: '/delivery',
          },
        ],
      },
      {
        id: 'team',
        title: 'Team activity',
        description: 'Keep everyone aligned on who ordered what and manage permissions.',
        icon: Users2,
        accentClass: 'from-pink-500/10 via-pink-500/5 to-background/30',
        status: teamStatus,
        actions: [
          {
            label: 'Who ordered what',
            description: teamInsights.ordersThisWeek > 0
              ? `${teamInsights.ordersThisWeek} order${teamInsights.ordersThisWeek === 1 ? '' : 's'} placed in the past week.`
              : 'Orders will appear once your team starts buying.',
            to: '/orders',
          },
          {
            label: 'Roles & permissions',
            description: 'Control access to ordering and budgets.',
            to: '/settings',
          },
          {
            label: 'Invite new member',
            description: teamInsights.lastActivity
              ? `Last activity recorded ${format(teamInsights.lastActivity, 'MMM d, HH:mm')}.`
              : 'Bring your team in to collaborate.',
            to: '/settings',
          },
        ],
      },
      {
        id: 'analytics',
        title: 'Analytics & insights',
        description: 'Spot price changes, category trends and savings opportunities.',
        icon: LineChart,
        accentClass: 'from-blue-500/10 via-blue-500/5 to-background/30',
        status: analyticsStatus,
        actions: [
          {
            label: 'Top purchased categories',
            description: spendData?.categories?.length
              ? `${spendData.categories[0].name} is leading your spend.`
              : 'Insights unlock after your first orders.',
            to: '/price-history',
          },
          {
            label: 'Price changes spotted',
            description: alerts.length > 0
              ? `Review ${alerts.length} recent price alert${alerts.length === 1 ? '' : 's'}.`
              : 'We’ll notify you when suppliers adjust pricing.',
            to: '/compare',
          },
          {
            label: 'Trends this month',
            description: 'Explore spend patterns and supplier performance.',
            to: '/price-history',
          },
        ],
      },
    ]
  }, [
    suppliersLoading,
    suppliers.length,
    needsAttention,
    connectedSuppliers,
    pantryLoading,
    pantryItems.length,
    spendLoading,
    spendData,
    deliveriesLoading,
    deliveriesSummary,
    auditLoading,
    teamInsights,
    alertsLoading,
    alerts.length,
  ])

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((category) => (
          <DashboardCategoryCard key={category.id} {...category} />
        ))}
      </div>
    </div>
  )
}
