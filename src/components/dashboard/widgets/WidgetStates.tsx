import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WidgetEmptyStateProps {
  title: string
  description: string
  actionLabel: string
  onAction?: () => void
}

export function WidgetEmptyState({ title, description, actionLabel, onAction }: WidgetEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAction} size="lg">
        {actionLabel}
      </Button>
    </div>
  )
}

interface WidgetErrorStateProps {
  message: string
  onRetry?: () => void
}

export function WidgetErrorState({ message, onRetry }: WidgetErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4 text-sm">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">Something went wrong</span>
      </div>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" size="lg">
          Retry
        </Button>
      ) : null}
    </div>
  )
}

interface WidgetNoPermissionStateProps {
  message: string
  actionLabel?: string
  onRequestAccess?: () => void
}

export function WidgetNoPermissionState({ message, actionLabel, onRequestAccess }: WidgetNoPermissionStateProps) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4 text-sm">
      <div className="flex items-center gap-3 text-slate-600">
        <Lock className="h-6 w-6" aria-hidden="true" />
        <span className="text-base font-semibold">Access required</span>
      </div>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      {actionLabel ? (
        <Button onClick={onRequestAccess} size="lg">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

interface WidgetLoadingStateProps {
  rows?: number
  variant?: 'rows' | 'stat' | 'bars'
}

export function WidgetLoadingState({ rows = 3, variant = 'rows' }: WidgetLoadingStateProps) {
  if (variant === 'stat') {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    )
  }

  if (variant === 'bars') {
    return (
      <div className="flex h-full flex-col justify-center gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={cn('h-3 rounded-full bg-muted', index === 0 && 'w-5/6', index === 1 && 'w-3/4')} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 rounded-xl" />
      ))}
    </div>
  )
}
