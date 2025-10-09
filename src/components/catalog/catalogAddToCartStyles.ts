export const CATALOG_ADD_TO_CART_BUTTON_CLASSES = {
  button:
    'inline-flex h-[2.625rem] w-full items-center justify-center rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground shadow-sm transition-colors duration-150 hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  disabled:
    'inline-flex h-[2.625rem] w-full items-center justify-center rounded-full bg-muted px-4 text-sm font-medium text-muted-foreground shadow-none',
  passive:
    'inline-flex h-[2.625rem] w-full items-center justify-center rounded-full border border-border/70 bg-background/80 px-4 text-sm font-medium text-muted-foreground shadow-none backdrop-blur-sm',
  unavailable:
    'inline-flex h-[2.625rem] w-full items-center justify-center rounded-full border border-dashed border-muted-foreground/60 bg-background/70 px-4 text-sm font-medium text-muted-foreground shadow-none',
} as const

export const CATALOG_ADD_TO_CART_STEPPER_CLASSES = {
  stepper:
    'h-[2.625rem] min-h-[2.625rem] w-full justify-center rounded-full border border-border/60 bg-background/90 px-1.5 shadow-none transition-opacity [&_.catalog-card__stepper-btn]:h-[2.625rem] [&_.catalog-card__stepper-btn]:min-h-[2.625rem] [&_.catalog-card__stepper-btn]:min-w-[2.625rem] [&_.catalog-card__stepper-count]:h-[2.625rem] [&_.catalog-card__stepper-count]:leading-[2.625rem]',
  feedbackOverlay: 'pointer-events-none absolute inset-0 flex items-center justify-center',
  feedbackInner:
    'flex h-full w-full items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-500/10 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200',
  maxHint: 'pt-0.5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground',
} as const
