import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Factory,
  GripVertical,
  LineChart,
  PiggyBank,
  Plus,
  Square,
  SquareSplitHorizontal,
  SquareStack,
  Truck,
  Users2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/IconButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DashboardLayoutProvider,
  DashboardTileSize,
  useDashboardLayout,
} from './dashboard-layout-context'
import { ManageDashboardPanel } from './ManageDashboardPanel'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

type TileTone = 'neutral' | 'positive' | 'warning' | 'alert'

interface TileStatus {
  label: string
  tone?: TileTone
  isLoading?: boolean
}

interface DashboardTile {
  id: string
  title: string
  tagline: string
  to: string
  ctaLabel: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accent: {
    background: string
    bubble: string
  }
  status?: TileStatus
}

const toneClass: Record<TileTone, string> = {
  neutral: 'bg-white/10 text-white',
  positive: 'bg-emerald-400/35 text-white',
  warning: 'bg-amber-400/35 text-white',
  alert: 'bg-rose-500/40 text-white',
}

const tileSizeWrapperClass: Record<DashboardTileSize, string> = {
  small: 'md:col-span-1 xl:col-span-1',
  medium: 'md:col-span-2 xl:col-span-2',
  large: 'md:col-span-2 xl:col-span-3',
}

function TileStatusBadge({ status }: { status?: TileStatus }) {
  if (!status) return null
  if (status.isLoading) {
    return <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
  }

  if (!status.label) return null

  const tone = status.tone ?? 'neutral'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur',
        toneClass[tone]
      )}
    >
      {status.label}
    </span>
  )
}

interface DashboardTileCardProps {
  tile: DashboardTile
  size: DashboardTileSize
  onSizeChange: (size: DashboardTileSize) => void
  dragAttributes: React.AriaAttributes & React.HTMLAttributes<HTMLElement>
  dragListeners: Record<string, unknown> | undefined
  setDragHandleRef: React.RefCallback<HTMLButtonElement>
  isDragging?: boolean
}

function DashboardTileCard({
  tile,
  size,
  onSizeChange,
  dragAttributes,
  dragListeners,
  setDragHandleRef,
  isDragging,
}: DashboardTileCardProps) {
  const { title, tagline, to, ctaLabel, icon: Icon, accent, status } = tile

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border-none p-6 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl',
        isDragging && 'ring-2 ring-offset-2 ring-offset-transparent ring-white/70',
        accent.background
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn('grid h-14 w-14 place-items-center rounded-2xl text-xl font-semibold', accent.bubble)}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <TileStatusBadge status={status} />
          <div className="flex items-center gap-2">
            <IconButton
              ref={setDragHandleRef}
              {...dragAttributes}
              {...(dragListeners ?? {})}
              aria-describedby={`${tile.id}-drag-hint`}
              label={`Reorder ${title}`}
              style={{ ['--icon-btn' as string]: '2.75rem' }}
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <GripVertical className="h-5 w-5" aria-hidden="true" />
            </IconButton>
            <ToggleGroup
              type="single"
              value={size}
              onValueChange={(value) => value && onSizeChange(value as DashboardTileSize)}
              aria-label={`Change ${title} size`}
              className="rounded-full bg-white/10 p-1"
            >
              <ToggleGroupItem value="small" size="lg" className="rounded-full text-white hover:bg-white/20">
                <span className="sr-only">Small</span>
                <Square className="h-4 w-4" aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="medium" size="lg" className="rounded-full text-white hover:bg-white/20">
                <span className="sr-only">Medium</span>
                <SquareSplitHorizontal className="h-4 w-4" aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="large" size="lg" className="rounded-full text-white hover:bg-white/20">
                <span className="sr-only">Large</span>
                <SquareStack className="h-4 w-4" aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-1 flex-col justify-between gap-6">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-3 max-w-xs text-sm text-white/80">{tagline}</p>
        </div>

        <Link
          to={to}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-slate-900"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </div>
      <span id={`${tile.id}-drag-hint`} className="sr-only">
        Use space or enter to pick up, then arrow keys to move.
      </span>
    </Card>
  )
}

interface SortableTileProps {
  tile: DashboardTile
  size: DashboardTileSize
  onSizeChange: (size: DashboardTileSize) => void
  sectionId: string
}

function SortableTile({ tile, size, onSizeChange, sectionId }: SortableTileProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.id,
    data: { sectionId },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn('col-span-1', tileSizeWrapperClass[size])}
    >
      <DashboardTileCard
        tile={tile}
        size={size}
        onSizeChange={onSizeChange}
        dragAttributes={attributes}
        dragListeners={listeners}
        setDragHandleRef={setActivatorNodeRef}
        isDragging={isDragging}
      />
    </div>
  )
}

function DashboardSection({
  id,
  title,
  tiles,
  tileMeta,
  onSizeChange,
  onAddWidget,
}: {
  id: string
  title: string
  tiles: DashboardTile[]
  tileMeta: Record<string, { size: DashboardTileSize; visible: boolean }>
  onSizeChange: (tileId: string, size: DashboardTileSize) => void
  onAddWidget: () => void
}) {
  const visibleTiles = tiles.filter((tile) => tileMeta[tile.id]?.visible !== false)
  const { setNodeRef, isOver } = useDroppable({ id: `section:${id}`, data: { sectionId: id } })

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">{title}</h2>
        <Button size="lg" variant="outline" onClick={onAddWidget} className="justify-start gap-2 sm:w-auto">
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add widget
        </Button>
      </header>
      <SortableContext id={id} items={visibleTiles.map((tile) => tile.id)} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'grid gap-6 md:grid-cols-2 xl:grid-cols-3',
            isOver && 'rounded-3xl ring-2 ring-primary/60 ring-offset-2 ring-offset-transparent'
          )}
        >
          {visibleTiles.map((tile) => (
            <SortableTile
              key={tile.id}
              tile={tile}
              size={tileMeta[tile.id]?.size ?? 'medium'}
              sectionId={id}
              onSizeChange={(nextSize) => onSizeChange(tile.id, nextSize)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}

function DashboardOverviewContent() {
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

  const tileContent: Record<string, DashboardTile> = useMemo(() => {
    const supplierStatus: TileStatus = suppliersLoading
      ? { label: 'Checking…', isLoading: true }
      : suppliers.length === 0
        ? { label: 'Add supplier', tone: 'neutral' }
        : needsAttention > 0
          ? { label: `Reconnect ${needsAttention}`, tone: 'alert' }
          : { label: `${connectedSuppliers} linked`, tone: 'positive' }

    const pantryStatus: TileStatus = pantryLoading
      ? { label: 'Scanning…', isLoading: true }
      : pantryItems.length > 0
        ? { label: `${pantryItems.length} low`, tone: 'warning' }
        : { label: 'All stocked', tone: 'positive' }

    const spendStatus: TileStatus = spendLoading
      ? { label: 'Calculating…', isLoading: true }
      : spendData && spendData.thisWeek > 0
        ? {
            label: `${formatCurrency(spendData.thisWeek)} this week`,
            tone: spendData.change > 15 ? 'alert' : 'positive',
          }
        : { label: 'Awaiting orders', tone: 'neutral' }

    const deliveriesStatus: TileStatus = deliveriesLoading
      ? { label: 'Syncing…', isLoading: true }
      : deliveriesSummary.deliveriesDue > 0
        ? {
            label: `${deliveriesSummary.deliveriesDue} incoming`,
            tone: 'positive',
          }
        : { label: 'No deliveries set', tone: 'neutral' }

    const teamStatus: TileStatus = auditLoading
      ? { label: 'Reviewing…', isLoading: true }
      : teamInsights.uniqueUsers > 0
        ? {
            label: `${teamInsights.uniqueUsers} active`,
            tone: 'positive',
          }
        : { label: 'Invite teammates', tone: 'neutral' }

    const analyticsStatus: TileStatus = alertsLoading
      ? { label: 'Gathering…', isLoading: true }
      : alerts.length > 0
        ? { label: `${alerts.length} alerts`, tone: 'alert' }
        : spendData?.categories?.length
          ? {
              label: `${spendData.categories[0].name} leading`,
              tone: 'positive',
            }
          : { label: 'Insights soon', tone: 'neutral' }

    return {
      suppliers: {
        id: 'suppliers',
        title: 'Suppliers',
        tagline:
          suppliers.length > 0
            ? 'Manage connections and discovery in one hub.'
            : 'Connect the partners you buy from every week.',
        to: '/suppliers',
        ctaLabel: suppliers.length > 0 ? 'Open supplier hub' : 'Add your first supplier',
        icon: Factory,
        accent: {
          background: 'bg-gradient-to-br from-amber-500 to-amber-700',
          bubble: 'bg-white/15 text-white',
        },
        status: supplierStatus,
      },
      deliveries: {
        id: 'deliveries',
        title: 'Deliveries',
        tagline: deliveriesSummary.nextDeliveryDate
          ? `Next drop on ${format(deliveriesSummary.nextDeliveryDate, 'MMM d')}.`
          : 'Plan the week ahead with shared delivery windows.',
        to: '/delivery',
        ctaLabel: 'Review schedule',
        icon: Truck,
        accent: {
          background: 'bg-gradient-to-br from-purple-500 to-indigo-600',
          bubble: 'bg-white/15 text-white',
        },
        status: deliveriesStatus,
      },
      pantry: {
        id: 'pantry',
        title: 'Pantry',
        tagline:
          pantryItems.length > 0
            ? `${pantryItems.length} items ready for reorder.`
            : 'Signals appear once we see order history.',
        to: '/pantry',
        ctaLabel: 'View pantry signals',
        icon: ClipboardList,
        accent: {
          background: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          bubble: 'bg-white/15 text-white',
        },
        status: pantryStatus,
      },
      spend: {
        id: 'spend',
        title: 'Spend & Budgets',
        tagline:
          spendData && spendData.thisWeek > 0
            ? `${formatCurrency(spendData.thisWeek)} across ${spendData.ordersThisWeek} orders.`
            : 'Track spend the moment your first order lands.',
        to: '/orders',
        ctaLabel: 'Open spend view',
        icon: PiggyBank,
        accent: {
          background: 'bg-gradient-to-br from-sky-500 to-cyan-600',
          bubble: 'bg-white/15 text-white',
        },
        status: spendStatus,
      },
      'team-activity': {
        id: 'team-activity',
        title: 'Team Activity',
        tagline:
          teamInsights.ordersThisWeek > 0
            ? `${teamInsights.ordersThisWeek} orders placed in the last 7 days.`
            : teamInsights.lastActivity
              ? `Last activity ${format(teamInsights.lastActivity, 'MMM d, HH:mm')}.`
              : 'See who is ordering and manage roles.',
        to: '/settings',
        ctaLabel: teamInsights.uniqueUsers > 0 ? 'Manage team' : 'Invite teammates',
        icon: Users2,
        accent: {
          background: 'bg-gradient-to-br from-pink-500 to-rose-600',
          bubble: 'bg-white/15 text-white',
        },
        status: teamStatus,
      },
      analytics: {
        id: 'analytics',
        title: 'Analytics',
        tagline:
          alerts.length > 0
            ? `Spot ${alerts.length} new price movement${alerts.length === 1 ? '' : 's'}.`
            : 'Dig into price trends and supplier performance.',
        to: '/price-history',
        ctaLabel: 'Launch analytics',
        icon: LineChart,
        accent: {
          background: 'bg-gradient-to-br from-blue-500 to-slate-700',
          bubble: 'bg-white/15 text-white',
        },
        status: analyticsStatus,
      },
    }
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

  const { sections, tileMeta, moveTile, setTileSize } = useDashboardLayout()
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sectionTiles = useMemo(() => {
    return sections.map((section) => {
      const tiles = section.tileIds
        .map((tileId) => tileContent[tileId])
        .filter((tile): tile is DashboardTile => Boolean(tile))
      return { ...section, tiles }
    })
  }, [sections, tileContent])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeId = active.id as string

    if (over.id === activeId) return

    const overId = over.id as string

    if (overId.startsWith('section:')) {
      const targetSectionId = overId.replace('section:', '')
      const section = sectionTiles.find((item) => item.id === targetSectionId)
      if (!section) return
      moveTile({ tileId: activeId, toSectionId: targetSectionId, targetIndex: section.tileIds.length })
      return
    }

    const destinationSection = sectionTiles.find((section) => section.tileIds.includes(overId))
    if (!destinationSection) return

    const targetIndex = destinationSection.tileIds.indexOf(overId)
    moveTile({
      tileId: activeId,
      toSectionId: destinationSection.id,
      targetIndex: targetIndex === -1 ? destinationSection.tileIds.length : targetIndex,
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <>
      <div className="space-y-12">
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {sectionTiles.map((section) => {
            const sectionTileMeta = Object.fromEntries(
              section.tiles.map((tile) => [
                tile.id,
                tileMeta[tile.id] ?? { size: 'medium' as const, visible: true },
              ])
            )
            return (
              <DashboardSection
                key={section.id}
                id={section.id}
                title={section.title}
                tiles={section.tiles}
                tileMeta={sectionTileMeta}
                onSizeChange={(tileId, size) => setTileSize(tileId, size)}
                onAddWidget={() => setIsManageOpen(true)}
              />
            )
          })}
          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
            {activeId ? (
              (() => {
                const tile = tileContent[activeId as string]
                if (!tile) return null
                const size = tileMeta[activeId as string]?.size ?? 'medium'
                return (
                  <div className={cn('col-span-1 max-w-sm', tileSizeWrapperClass[size])}>
                    <DashboardTileCard
                      tile={tile}
                      size={size}
                      onSizeChange={() => {}}
                      dragAttributes={{}}
                      dragListeners={{}}
                      setDragHandleRef={() => {}}
                      isDragging
                    />
                  </div>
                )
              })()
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <ManageDashboardPanel
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
        tiles={Object.values(tileContent)}
      />
    </>
  )
}

export default function DashboardOverview() {
  return (
    <DashboardLayoutProvider>
      <DashboardOverviewContent />
    </DashboardLayoutProvider>
  )
}
