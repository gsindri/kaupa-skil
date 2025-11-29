import React, { useEffect, useMemo, useState } from 'react'
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
import {
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Plus,
  Save,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DashboardSectionLayout,
  useDashboardLayout,
} from './dashboard-layout-context'
import {
  type DashboardSectionId,
  type DashboardWidgetDefinition,
  type DashboardWidgetSize,
} from './widget-types'
import { DASHBOARD_WIDGET_CATALOG, getWidgetDefinitionById } from './widgetCatalog'
import { useLazyMount } from '@/hooks/useLazyMount'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { DashboardSkeleton } from './DashboardSkeleton'

const SIZE_CLASS: Record<DashboardWidgetSize, string> = {
  S: 'md:col-span-4',
  M: 'md:col-span-6',
  L: 'md:col-span-12',
}

const SIZE_LABEL: Record<DashboardWidgetSize, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
}

function WidgetCard({
  definition,
  size,
  editMode,
  onSizeChange,
  onHide,
  dragHandleProps,
  dragHandleRef,
  children,
  isDragging,
}: {
  definition: DashboardWidgetDefinition
  size: DashboardWidgetSize
  editMode: boolean
  onSizeChange: (size: DashboardWidgetSize) => void
  onHide: () => void
  dragHandleProps: Record<string, unknown>
  dragHandleRef: (node: HTMLButtonElement | null) => void
  children: React.ReactNode
  isDragging: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex h-full min-h-[220px] flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-[0_4px_16px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_6px_24px_rgba(15,23,42,0.12)]',
        isDragging && 'ring-2 ring-primary/50'
      )}
    >
      {editMode ? (
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={size}
            className="flex rounded-full bg-muted/60 p-1"
            onValueChange={(value) => value && onSizeChange(value as DashboardWidgetSize)}
            aria-label={`Resize ${definition.name}`}
          >
            {(['S', 'M', 'L'] as DashboardWidgetSize[]).map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-10 w-10 rounded-full text-xs font-semibold"
                title={SIZE_LABEL[value]}
                aria-label={SIZE_LABEL[value]}
              >
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full"
                aria-label={`More options for ${definition.name}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onHide}>Hide from this layout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="secondary"
            size="icon"
            ref={dragHandleRef}
            className="h-10 w-10 rounded-full"
            {...dragHandleProps}
            aria-label={`Drag to reorder ${definition.name}`}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <div className="flex-1 pt-2">{children}</div>
    </div>
  )
}

function SortableWidget({
  widgetId,
  definition,
  size,
  editMode,
  onSizeChange,
  onHide,
  index,
}: {
  widgetId: string
  definition: DashboardWidgetDefinition
  size: DashboardWidgetSize
  editMode: boolean
  onSizeChange: (size: DashboardWidgetSize) => void
  onHide: () => void
  index: number
}) {
  const {
    setNodeRef,
    listeners,
    setActivatorNodeRef,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId, disabled: !editMode })
  const { ref: lazyRef, isVisible } = useLazyMount<HTMLDivElement>()

  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    lazyRef.current = node
  }

  const WidgetComponent = definition.component

  return (
    <div
      ref={combinedRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
      className={cn('col-span-12 animate-card-reveal', SIZE_CLASS[size])}
    >
      <WidgetCard
        definition={definition}
        size={size}
        editMode={editMode}
        onSizeChange={onSizeChange}
        onHide={onHide}
        dragHandleProps={{ ...attributes, ...listeners }}
        dragHandleRef={setActivatorNodeRef}
        isDragging={isDragging}
      >
        {isVisible ? (
          <WidgetComponent definition={definition} size={size} isInEditMode={editMode} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preparing…</div>
        )}
      </WidgetCard>
    </div>
  )
}

interface WidgetCatalogDialogProps {
  open: boolean
  sectionId: DashboardSectionId | null
  onClose: () => void
  onSelect: (definition: DashboardWidgetDefinition) => void
  disabledIds: Set<string>
}

function WidgetCatalogDialog({ open, sectionId, onClose, onSelect, disabledIds }: WidgetCatalogDialogProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | 'starter' | 'advanced' | 'utility'>('all')

  useEffect(() => {
    if (!open) {
      setSearch('')
      setCategory('all')
    }
  }, [open])

  const filtered = useMemo(() => {
    return DASHBOARD_WIDGET_CATALOG.filter((widget) => {
      if (category !== 'all' && widget.category !== category) return false
      if (!search) return true
      const haystack = `${widget.name} ${widget.description} ${widget.keywords?.join(' ') ?? ''}`.toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
  }, [category, search])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl space-y-6">
        <DialogHeader>
          <DialogTitle>Add widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to the {sectionId ?? 'selected'} section. You can adjust size after placing it on the grid.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {['all', 'starter', 'advanced', 'utility'].map((value) => (
            <Button
              key={value}
              type="button"
              variant={category === value ? 'default' : 'secondary'}
              size="sm"
              className="rounded-full"
              onClick={() => setCategory(value as typeof category)}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search widgets"
            className="pl-9"
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((widget) => (
            <button
              key={widget.id}
              type="button"
              onClick={() => {
                onSelect(widget)
                onClose()
              }}
              disabled={disabledIds.has(widget.id)}
              className={cn(
                'flex flex-col gap-2 rounded-2xl border border-border/60 p-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary',
                disabledIds.has(widget.id) && 'pointer-events-none opacity-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{widget.name}</p>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {widget.category}
                </Badge>
              </div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
              No widgets match your search.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SectionGridProps {
  section: DashboardSectionLayout & { widgetSizes: Record<string, DashboardWidgetSize> }
  editMode: boolean
  onSizeChange: (widgetId: string, size: DashboardWidgetSize) => void
  onHide: (widgetId: string) => void
  widgetSizes: Record<string, DashboardWidgetSize>
}

function SectionGrid({ section, editMode, onSizeChange, onHide, widgetSizes }: SectionGridProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    disabled: !editMode,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed transition-colors',
        isOver && editMode ? 'border-primary bg-primary/5' : 'border-transparent',
        section.widgetIds.length === 0 && editMode && 'min-h-[200px] border-muted-foreground/30 bg-muted/20'
      )}
    >
      {section.widgetIds.length === 0 && editMode ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          Drop widgets here
        </div>
      ) : (
        <SortableContext items={section.widgetIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-4">
            {section.widgetIds.map((widgetId, index) => {
              const definition = getWidgetDefinitionById(widgetId)
              if (!definition) return null
              const size = widgetSizes[widgetId] ?? definition.defaultSize
              return (
                <SortableWidget
                  key={widgetId}
                  widgetId={widgetId}
                  definition={definition}
                  size={size}
                  editMode={editMode}
                  onSizeChange={(nextSize) => onSizeChange(widgetId, nextSize)}
                  onHide={() => onHide(widgetId)}
                  index={index}
                />
              )
            })}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

function SavePresetDialog({
  open,
  onClose,
  onSave,
  isSaving,
  initialName,
}: {
  open: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  isSaving: boolean
  initialName: string
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [initialName, open])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter a name to save this preset.')
      return
    }
    await onSave(name.trim())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm space-y-4">
        <DialogHeader>
          <DialogTitle>Save preset</DialogTitle>
          <DialogDescription>Name this layout so you can reuse it later.</DialogDescription>
        </DialogHeader>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Preset name" />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardOverview() {
  const {
    sections,
    widgetMeta,
    moveWidget,
    setWidgetSize,
    removeWidget,
    addWidget,
    currentPreset,
    availablePresets,
    applyPreset,
    savePreset,
    isLoading,
    isSaving,
  } = useDashboardLayout()
  const [editMode, setEditMode] = useState(false)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [catalogSection, setCatalogSection] = useState<DashboardSectionId | null>(null)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const trackTelemetry = useDashboardTelemetry()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!editMode) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditMode(false)
        trackTelemetry('edit_mode_off')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editMode, trackTelemetry])

  const reduceMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const visibleSections = useMemo(() => {
    return sections.map((section) => {
      const widgetIds = section.widgetIds.filter((id) => widgetMeta[id]?.visible !== false)
      const widgetSizes = widgetIds.reduce<Record<string, DashboardWidgetSize>>((acc, widgetId) => {
        const metaEntry = widgetMeta[widgetId]
        if (metaEntry?.size) {
          acc[widgetId] = metaEntry.size
        }
        return acc
      }, {})

      return { ...section, widgetIds, widgetSizes }
    })
  }, [sections, widgetMeta])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (overId === activeId) return

    if (overId.startsWith('section:')) {
      const sectionId = overId.replace('section:', '') as DashboardSectionId
      moveWidget({ widgetId: activeId, toSectionId: sectionId, targetIndex: visibleSections.find((section) => section.id === sectionId)?.widgetIds.length ?? 0 })
      return
    }

    const destinationSection = visibleSections.find((section) => section.widgetIds.includes(overId))
    if (!destinationSection) return
    const targetIndex = destinationSection.widgetIds.indexOf(overId)
    moveWidget({ widgetId: activeId, toSectionId: destinationSection.id, targetIndex })
  }

  const handleDragCancel = () => setActiveId(null)

  const disabledWidgetIds = useMemo(() => {
    const ids = new Set<string>()
    Object.entries(widgetMeta).forEach(([id, meta]) => {
      if (meta.visible) ids.add(id)
    })
    return ids
  }, [widgetMeta])

  const activeDefinition = activeId ? getWidgetDefinitionById(String(activeId)) : null
  const activeSize = activeId && widgetMeta[String(activeId)] ? widgetMeta[String(activeId)].size : 'M'

  const sectionRender = visibleSections.map((section) => (
    <section key={section.id} className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">{section.title}</h2>
        {editMode ? (
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => {
              setCatalogSection(section.id)
              setIsCatalogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add widget
          </Button>
        ) : null}
      </header>
      <SectionGrid
        section={section}
        editMode={editMode}
        onSizeChange={(widgetId, nextSize) => setWidgetSize(widgetId, nextSize)}
        onHide={(widgetId) => removeWidget(widgetId)}
        widgetSizes={section.widgetSizes ?? {}}
      />
    </section>
  ))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Select value={currentPreset} onValueChange={(value) => applyPreset(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {availablePresets.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => setIsSaveDialogOpen(true)}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save preset
          </Button>
          {isSaving ? <span className="text-xs text-muted-foreground">Saving layout…</span> : null}
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={() => {
            const next = !editMode
            setEditMode(next)
            trackTelemetry(next ? 'edit_mode_on' : 'edit_mode_off')
          }}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', editMode && 'rotate-180')} aria-hidden="true" />
          {editMode ? 'Done' : 'Customize'}
        </Button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="space-y-10">{sectionRender}</div>
          <DragOverlay dropAnimation={reduceMotion ? null : { duration: 180, easing: 'ease-out' }}>
            {activeDefinition ? (
              <div className={cn('col-span-12', SIZE_CLASS[activeSize])}>
                <WidgetCard
                  definition={activeDefinition}
                  size={activeSize}
                  editMode={true}
                  onSizeChange={() => { }}
                  onHide={() => { }}
                  dragHandleProps={{}}
                  dragHandleRef={() => { }}
                  isDragging
                >
                  {(() => {
                    const ActiveComponent = activeDefinition.component
                    return (
                      <ActiveComponent
                        definition={activeDefinition}
                        size={activeSize as DashboardWidgetSize}
                        isInEditMode={editMode}
                      />
                    )
                  })()}
                </WidgetCard>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <WidgetCatalogDialog
        open={isCatalogOpen}
        sectionId={catalogSection}
        onClose={() => setIsCatalogOpen(false)}
        onSelect={(definition) => {
          if (!catalogSection) return
          addWidget({ widgetId: definition.id, sectionId: catalogSection, size: definition.defaultSize })
        }}
        disabledIds={disabledWidgetIds}
      />

      <SavePresetDialog
        open={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={savePreset}
        isSaving={isSaving}
        initialName={currentPreset}
      />
    </div>
  )
}
