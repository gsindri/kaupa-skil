import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { lockScroll, unlockScroll } from "@/lib/lockScroll"
const Dialog = ({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  React.useEffect(() => {
    if (open) {
        lockScroll()
    } else {
        unlockScroll()
    }
  }, [open])

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={o => {
        if (o) {
          lockScroll()
        } else {
          unlockScroll()
        }
        onOpenChange?.(o)
      }}
      {...props}
    />
  )
}
Dialog.displayName = "Dialog"

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[var(--z-dialog-overlay,70)] bg-[color:var(--overlay)] backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  variant?: "default" | "spotlight"
  hideCloseButton?: boolean
  overlayClassName?: string
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, variant = "default", hideCloseButton, overlayClassName, ...props }, ref) => {
  const spotlight = variant === "spotlight"
  const shouldHideClose = hideCloseButton ?? spotlight
  const overlayClasses = cn(overlayClassName)

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClasses} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 z-[var(--z-dialog-content,80)] grid w-full gap-0",
          "tw-pop p-0 shadow-[var(--elev-shadow)] duration-[var(--enter)] ease-snap motion-reduce:transition-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          spotlight
            ? "top-[18vh] -translate-x-1/2 translate-y-0 sm:top-[16vh] md:top-[14vh] max-w-[min(760px,calc(100vw-32px))]"
            : "top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl",
          className
        )}
        {...props}
      >
        {!spotlight ? (
          <div className="h-1 w-full rounded-t-[var(--radius-xl)] bg-[color:var(--brand-accent)]" />
        ) : null}
        {children}
        {!shouldHideClose ? (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity duration-fast ease-snap hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground motion-reduce:transition-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
