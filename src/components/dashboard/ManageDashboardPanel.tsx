import React, { useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useDashboardLayout } from './dashboard-layout-context'

interface ManageDashboardPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tiles: Array<{
    id: string
    title: string
    tagline: string
  }>
}

export function ManageDashboardPanel({ open, onOpenChange, tiles }: ManageDashboardPanelProps) {
  const { sections, tileMeta, setTileVisibility } = useDashboardLayout()

  const tileLookup = useMemo(() => {
    return Object.fromEntries(tiles.map((tile) => [tile.id, tile]))
  }, [tiles])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl space-y-8 overflow-y-auto p-8">
        <SheetHeader>
          <SheetTitle>Manage dashboard</SheetTitle>
          <SheetDescription>
            Choose which widgets appear on your overview. Hidden widgets remain configured and can be re-enabled at any time.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                {section.title}
              </h3>

              <div className="space-y-3">
                {section.tileIds.map((tileId) => {
                  const tile = tileLookup[tileId]
                  if (!tile) return null
                  const isVisible = tileMeta[tileId]?.visible !== false

                  return (
                    <label
                      key={tileId}
                      className="flex min-h-[56px] items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-border"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{tile.title}</p>
                        <p className="text-xs text-muted-foreground">{tile.tagline}</p>
                      </div>
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) => setTileVisibility(tileId, checked)}
                        aria-label={`Toggle ${tile.title}`}
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
