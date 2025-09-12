# Sidebar ChatPack 2025-09-12T11:42:15.706Z

_Contains 12 file(s)._

---

## src\components\quick\SmartCartSidebar.tsx

```tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  TrendingUp,
  Truck,
  AlertTriangle,
  Plus,
  Lightbulb
} from 'lucide-react';
import { useCart } from '@/contexts/useBasket';
import { useSettings } from '@/contexts/useSettings';
import { PLACEHOLDER_IMAGE } from '@/lib/images';

interface SmartCartSidebarProps {
  className?: string;
}

export function SmartCartSidebar({ className = "" }: SmartCartSidebarProps) {
  const { items, getTotalItems, getTotalPrice, addItem } = useCart();
  const { includeVat } = useSettings();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Mock delivery optimization data
  const deliveryOptimization = {
    currentDeliveryFees: 3500,
    optimizedDeliveryFees: 1500,
    potentialSavings: 2000,
    suggestions: [
      {
        type: 'consolidate',
        message: 'Add ISK 1,200 more from Metro to get free delivery',
        items: ['Organic Milk 1L', 'Premium Bread']
      },
      {
        type: 'alternative',
        message: 'Switch 2 items to Costco to save ISK 800',
        items: ['Olive Oil', 'Pasta']
      }
    ]
  };

  const handleAddSuggestedItem = (itemName: string) => {
    // Mock adding suggested item
    addItem({
      id: `suggested-${Date.now()}`,
      supplierId: 'metro',
      supplierName: 'Metro',
      itemName: itemName,
      sku: `SKU-${Date.now()}`,
      packSize: '1 unit',
      packPrice: 400,
      unitPriceExVat: 400,
      unitPriceIncVat: 496,
      vatRate: 0.24,
      unit: 'pc',
      supplierItemId: `suggested-${Date.now()}`,
      displayName: itemName,
      packQty: 1,
      image: PLACEHOLDER_IMAGE
    });
  };

  if (getTotalItems() === 0) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cart Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({getTotalItems()} items)
            </span>
            <span className="font-mono text-sm">
              {formatPrice(getTotalPrice(includeVat))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.slice(0, 3).map((item) => (
            <div key={item.supplierItemId} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.itemName}</div>
                <div className="text-muted-foreground text-xs">
                  {item.quantity}× {item.packSize} • {item.supplierName}
                </div>
              </div>
              <div className="font-mono text-xs">
                {formatPrice((includeVat ? item.unitPriceIncVat : item.unitPriceExVat) * item.quantity)}
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{items.length - 3} more items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Optimization */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-4 w-4" />
            Delivery Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Current delivery fees:</span>
            <span className="font-mono text-blue-900">
              {formatPrice(deliveryOptimization.currentDeliveryFees)}
            </span>
          </div>
          
          {deliveryOptimization.potentialSavings > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <div className="text-xs text-green-800">
                Save {formatPrice(deliveryOptimization.potentialSavings)} on delivery
              </div>
            </div>
          )}

          <div className="space-y-2">
            {deliveryOptimization.suggestions.map((suggestion, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="text-blue-700 font-medium">{suggestion.message}</div>
                <div className="flex flex-wrap gap-1">
                  {suggestion.items.map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2 bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => handleAddSuggestedItem(item)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <Button 
            className="w-full" 
            onClick={() => {/* Navigate to checkout */}}
          >
            Proceed to Checkout
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Save as List
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Share Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

```


---

## src\components\ui\sidebar-constants.ts

```ts
export const SIDEBAR_WIDTH = "16rem"
export const SIDEBAR_WIDTH_MOBILE = "18rem"
export const SIDEBAR_WIDTH_ICON = "3rem"
export const SIDEBAR_KEYBOARD_SHORTCUT = "b"

```


---

## src\components\ui\sidebar-provider.tsx

```tsx

"use client"

import * as React from "react"
import { SidebarContext } from "@/components/ui/use-sidebar"
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "@/components/ui/sidebar-constants"

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the `open` state managed by the sidebar.
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `sidebar:state=${openState}; path=/; max-age=${60 * 60 * 24 * 7}`
    },
    [setOpenProp, open]
  )

  // Helper to detect mobile screen sizes
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  React.useEffect(() => {
    const headerLeft = isMobile
      ? '0px'
      : open
        ? 'var(--sidebar-w)'
        : 'var(--sidebar-rail-w)'
    document.documentElement.style.setProperty('--header-left', headerLeft)
  }, [open, isMobile])

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev)
  }, [isMobile, setOpen, setOpenMobile])

  // Fix: Ensure state is properly typed as "expanded" | "collapsed"
  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
          style={
            {
              "--sidebar-w": SIDEBAR_WIDTH,
              "--sidebar-rail-w": SIDEBAR_WIDTH_ICON,
              "--header-left": isMobile
                ? '0px'
                : open
                  ? SIDEBAR_WIDTH
                  : SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
        className={className}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

```


---

## src\components\ui\sidebar.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/use-sidebar"
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON,
} from "@/components/ui/sidebar-constants"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-w] flex-col bg-sidebar text-sidebar-foreground overflow-x-hidden",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-w] overflow-x-hidden bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-w": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* CRITICAL FIX: This spacing div must be w-0 when collapsed */}
        <div
          className={cn(
            "duration-300 relative h-svh bg-transparent transition-[width] ease-in-out",
            // Ensure width is truly 0 when collapsed in offcanvas mode
            state === "collapsed" && collapsible === "offcanvas" 
              ? "w-0 min-w-0" 
              : "w-[--sidebar-w]",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-rail-w)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-rail-w]"
          )}
        />
        <div
          className={cn(
            "fixed top-0 z-[80] hidden h-svh overflow-x-hidden md:flex rounded-none border-t-0 will-change-[width] transition-[left,right,width,opacity,transform,box-shadow] duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none",
            // CRITICAL FIX: Ensure complete hide when collapsed
              state === "collapsed" && collapsible === "offcanvas"
                ? "w-0 opacity-0 pointer-events-none -translate-x-full overflow-hidden shadow-none"
                : "w-[--sidebar-w] opacity-100 translate-x-0 shadow-lg",
            side === "left"
              ? "left-0"
              : "right-0",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-rail-w)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-rail-w] group-data-[side=left]:border-r group-data-[side=right]:border-l border-sidebar-border",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all duration-300 ease-in-out after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 pr-2 group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-muted-foreground outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button relative flex w-full items-center gap-2 overflow-hidden rounded-md px-4 py-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-[hsl(var(--primary)/0.08)] hover:text-sidebar-foreground focus-visible:ring-2 active:bg-[hsl(var(--primary)/0.12)] disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[hsl(var(--primary)/0.12)] data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 text-sidebar-muted-foreground data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-0 data-[active=true]:before:h-full data-[active=true]:before:w-0.5 data-[active=true]:before:bg-[hsl(var(--primary))]",
  {
    variants: {
      variant: {
        default: "",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-[hsl(var(--primary)/0.08)] hover:shadow-[0_0_0_1px_hsl(var(--primary))]",
      },
      size: {
        default: "h-11 text-sm",
        sm: "h-9 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
}

```


---

## src\components\ui\use-sidebar.ts

```ts
import * as React from "react"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

export { useSidebar, SidebarContext }

```


---

## src\contexts\useAuth.ts

```ts
import { useContext } from 'react'
import { AuthContext } from './AuthProviderUtils'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

```


---

## src\contexts\useBasket.ts

```ts
import { useContext } from 'react'
import { BasketContext } from './BasketProviderUtils'

export function useBasket() {
  const context = useContext(BasketContext)
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider')
  }
  return context
}

export const useCart = useBasket

```


---

## src\index.css

```css

@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@import './styles/globals.css';
@import './styles/design-system.css';
@import './styles/layout-vars.css';

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

:root{
  --font-ui: "Red Hat Text", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  --font-display: "Red Hat Display", var(--font-ui);

  /* type scale (tweak if needed) */
  --fs-h1: 28px; --fs-h2: 22px; --fs-h3: 18px; --fs-body: 15px; --fs-meta: 13px;
}

/* Defaults */
html { font-family: var(--font-ui); font-size: 15px; }
body { font-variant-numeric: normal; }

/* Headings / nav “brand voice” */
h1,h2,h3,.display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.005em; }
h1{ font-size: var(--fs-h1); } h2{ font-size: var(--fs-h2); } h3{ font-size: var(--fs-h3); }

/* UI text */
p,li,button,input,select,textarea,table { font-size: var(--fs-body); }
.meta, small { font-size: var(--fs-meta); opacity:.9; }

/* Import our comprehensive design system */

/* Ensure no default margins/padding for clean layout */
html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* Set a fallback header height so content can offset correctly */
:root {
  --sidebar-w: 256px; /* expanded width */
  --sidebar-rail-w: 48px; /* collapsed rail width */
  --header-right: 0px; /* reserved for symmetry */
}

@media (max-width: 1024px) {
  :root {
    --header-left: 0px;
  }
}

/* Header should start to the right of the sidebar */
[data-app-header="true"] {
  position: static;
  left: auto;
  width: auto;
}

body {
  @apply m-0 p-0;
  scroll-padding-top: var(--chrome-h);
}

#root {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* If no overlay is actively locking scroll, ensure no ghost gutter on body */
body:not([data-scroll-locked]) {
  padding-right: 0 !important;
  margin-right: 0 !important;
}

main > *:first-child {
  margin-top: 0;
}

html { scrollbar-gutter: stable; }

#catalogHeader {
  --hdr-h: var(--header-h, 56px);
  transform: translateY(calc(-1 * var(--hdr-p, 0) * var(--hdr-h)));
  transition: transform 180ms ease;
  will-change: transform;
}

#catalogHeader::before {
  /* Remove pseudo-element overlay that obscured the page */
  content: none !important;
}

@media (prefers-reduced-motion: reduce){
  #catalogHeader{ transition:none; }
}

/* 1) Ensure header is to the right of the sidebar */
[data-app-header="true"],
.app-header,
#catalogHeader {
  position: sticky;
  top: 0;
  left: var(--header-left, 0px);
  width: calc(100% - var(--header-left, 0px));
  z-index: 40;
}


```


---

## src\services\OrderingSuggestions.ts

```ts

import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'
import type { DeliveryCalculation } from '@/lib/types/delivery'
import { deliveryCalculator } from './DeliveryCalculator'

export interface OrderingSuggestion {
  id: string
  type: 'threshold_optimization' | 'consolidation' | 'timing_optimization'
  title: string
  description: string
  potential_savings: number
  confidence: number
  actions: SuggestionAction[]
  metadata: Record<string, any>
}

export interface SuggestionAction {
  type: 'add_item' | 'increase_quantity' | 'delay_order' | 'merge_suppliers'
  item_id?: string
  supplier_id?: string
  quantity_change?: number
  description: string
}

export class OrderingSuggestionsService {
  async generateSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Get current delivery calculations
    const deliveryCalculations = await deliveryCalculator.calculateOrderDelivery(cartItems)
    
    // Generate threshold optimization suggestions
    const thresholdSuggestions = await this.generateThresholdSuggestions(deliveryCalculations, cartItems)
    suggestions.push(...thresholdSuggestions)
    
    // Generate consolidation suggestions
    const consolidationSuggestions = await this.generateConsolidationSuggestions(cartItems)
    suggestions.push(...consolidationSuggestions)
    
    // Generate timing optimization suggestions
    const timingSuggestions = await this.generateTimingSuggestions(deliveryCalculations)
    suggestions.push(...timingSuggestions)
    
    return suggestions.sort((a, b) => b.potential_savings - a.potential_savings)
  }

  private async generateThresholdSuggestions(
    calculations: DeliveryCalculation[], 
    cartItems: CartItem[]
  ): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    for (const calc of calculations) {
      if (calc.is_under_threshold && calc.amount_to_free_delivery) {
        // Get frequently ordered items from this supplier
        const frequentItems = await this.getFrequentlyOrderedItems(calc.supplier_id)
        
        if (frequentItems.length > 0) {
          suggestions.push({
            id: `threshold_${calc.supplier_id}`,
            type: 'threshold_optimization',
            title: `Reach free delivery from ${calc.supplier_name}`,
            description: `Add ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()} more to save ISK${Math.ceil(calc.delivery_fee).toLocaleString()} in delivery fees`,
            potential_savings: calc.delivery_fee,
            confidence: 0.85,
            actions: [{
              type: 'add_item',
              supplier_id: calc.supplier_id,
              description: `Add items worth ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()}`
            }],
            metadata: {
              supplier_id: calc.supplier_id,
              threshold_amount: calc.threshold_amount,
              current_amount: calc.subtotal_ex_vat,
              suggested_items: frequentItems.slice(0, 3)
            }
          })
        }
      }
    }
    
    return suggestions
  }

  private async generateConsolidationSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Group by supplier and find opportunities to consolidate
    const supplierGroups = cartItems.reduce((groups, item) => {
      if (!groups[item.supplierId]) {
        groups[item.supplierId] = []
      }
      groups[item.supplierId].push(item)
      return groups
    }, {} as Record<string, CartItem[]>)
    
    // If we have multiple suppliers with small orders, suggest consolidation
    const smallOrders = Object.entries(supplierGroups).filter(([_, items]) => {
      const total = items.reduce((sum, item) => sum + (item.unitPriceExVat * item.quantity), 0)
      return total < 50000 // Less than ISK 50,000
    })
    
    if (smallOrders.length >= 2) {
      const totalSavings = smallOrders.length * 2000 // Estimate ISK 2,000 per supplier delivery fee
      
      suggestions.push({
        id: 'consolidate_suppliers',
        type: 'consolidation',
        title: 'Consolidate suppliers to reduce delivery fees',
        description: `Consider sourcing from fewer suppliers to reduce delivery costs`,
        potential_savings: totalSavings,
        confidence: 0.7,
        actions: [{
          type: 'merge_suppliers',
          description: `Review if items from ${smallOrders.length} suppliers can be sourced elsewhere`
        }],
        metadata: {
          small_order_suppliers: smallOrders.map(([supplierId]) => supplierId),
          estimated_fees: totalSavings
        }
      })
    }
    
    return suggestions
  }

  private async generateTimingSuggestions(calculations: DeliveryCalculation[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Check for suppliers with different delivery schedules
    const deliverySchedules = calculations
      .filter(calc => calc.next_delivery_day)
      .map(calc => ({
        supplier: calc.supplier_name,
        next_delivery: calc.next_delivery_day,
        supplier_id: calc.supplier_id
      }))
    
    if (deliverySchedules.length > 1) {
      const uniqueDates = [...new Set(deliverySchedules.map(s => s.next_delivery))]
      
      if (uniqueDates.length > 1) {
        suggestions.push({
          id: 'timing_optimization',
          type: 'timing_optimization',
          title: 'Optimize delivery timing',
          description: `Some suppliers have different delivery schedules. Consider timing orders for maximum efficiency.`,
          potential_savings: 0, // More about convenience than cost
          confidence: 0.6,
          actions: [{
            type: 'delay_order',
            description: 'Align order timing with delivery schedules'
          }],
          metadata: {
            delivery_schedules: deliverySchedules
          }
        })
      }
    }
    
    return suggestions
  }

  private async getFrequentlyOrderedItems(supplierId: string): Promise<any[]> {
    try {
      // Fixed: Removed .group() and used proper aggregation in the select
      const { data } = await (supabase as any)
        .rpc('get_frequent_items_by_supplier', {
          supplier_id_param: supplierId,
          days_back: 90
        })

      return (data as any[]) || []
    } catch (error) {
      console.error('Failed to fetch frequently ordered items:', error)
      // Fallback to a simpler query without grouping
      try {
        const { data } = await (supabase as any)
          .from('order_lines')
          .select(`
            supplier_item_id,
            supplier_items(name, pack_size, unit_price_ex_vat, unit_price_inc_vat)
          `)
          .eq('supplier_id', supplierId)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .limit(5)

        return (data as any[]) || []
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }
    }
  }
}

export const orderingSuggestions = new OrderingSuggestionsService()

```


---

## src\styles\design-system.css

```css
/* Iceland B2B Design System - Professional wholesale platform styling */

@layer base {
  :root {
    /* Primary Brand Colors - Professional blue palette inspired by Icelandic landscape */
    --primary: 212 95% 35%;
    --primary-foreground: 210 40% 98%;
    --primary-hover: 212 95% 30%;
    
    /* Secondary - Clean slate grays */
    --secondary: 215 15% 96%;
    --secondary-foreground: 215 25% 25%;
    --secondary-hover: 215 15% 92%;
    
    /* Accent - Icelandic aurora green */
    --accent: 165 85% 45%;
    --accent-foreground: 210 40% 98%;
    --accent-hover: 165 85% 40%;
    
    /* Status Colors */
    --success: 142 76% 36%;
    --success-foreground: 210 40% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 215 25% 25%;
    --error: 0 84% 60%;
    --error-foreground: 210 40% 98%;
    
    /* Neutral Palette */
    --background: 0 0% 100%;
    --foreground: 215 25% 15%;
    --muted: 215 15% 96%;
    --muted-foreground: 215 15% 45%;
    --border: 215 15% 90%;
    --input: 215 15% 95%;
    --ring: 212 95% 35%;
    
    /* Card & Surface */
    --card: 0 0% 100%;
    --card-foreground: 215 25% 15%;
    
    /* Popover & Dialog */
    --popover: 0 0% 100%;
    --popover-foreground: 215 25% 15%;

    /* Data Table Specific */
    --table-header: 215 15% 98%;
    --table-row-hover: 215 15% 98%;
    --table-border: 215 15% 92%;
    
    /* VAT Toggle Colors */
    --vat-inclusive: 165 85% 45%;
    --vat-exclusive: 212 95% 35%;
    
    /* Price Comparison */
    --price-best: 142 76% 36%;
    --price-good: 165 85% 45%;
    --price-average: 38 92% 50%;
    --price-expensive: 0 84% 60%;

    /* Sidebar */
    --sidebar-bg: 210 25% 97%;
    --sidebar-fg: 222 47% 11%;
    --sidebar-fg-muted: 222 12% 35%;
    --sidebar-border: 210 16% 90%;
    --sidebar: var(--sidebar-bg);
    --sidebar-foreground: var(--sidebar-fg);
    --sidebar-muted-foreground: var(--sidebar-fg-muted);
    --sidebar-accent: 212 95% 35% / 0.1;
    --sidebar-accent-foreground: var(--sidebar-fg);
    --sidebar-ring: 212 95% 35%;
    
    /* Radius */
    --radius: 0.5rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    
    /* Softer borders and shadows */
    --border-soft: hsl(var(--foreground) / 0.1);
    --shadow-soft: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
    --shadow-soft-md: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  }
  
  .dark {
    --background: 215 25% 8%;
    --foreground: 210 40% 98%;
    --card: 215 25% 10%;
    --card-foreground: 210 40% 98%;
    --popover: 215 25% 10%;
    --popover-foreground: 210 40% 98%;
    --primary: 212 95% 50%;
    --primary-foreground: 215 25% 8%;
    --secondary: 215 25% 15%;
    --secondary-foreground: 210 40% 98%;
    --muted: 215 25% 15%;
    --muted-foreground: 215 15% 65%;
    --accent: 165 85% 50%;
    --accent-foreground: 215 25% 8%;
    --border: 215 25% 20%;
    --input: 215 25% 15%;
    --ring: 212 95% 50%;

    /* Sidebar */
    --sidebar-bg: 222 22% 12%;
    --sidebar-fg: 0 0% 100%;
    --sidebar-fg-muted: 220 9% 70%;
    --sidebar-border: 220 8% 20%;
    --sidebar: var(--sidebar-bg);
    --sidebar-foreground: var(--sidebar-fg);
    --sidebar-muted-foreground: var(--sidebar-fg-muted);
    --sidebar-accent: 0 0% 100% / 0.06;
    --sidebar-accent-foreground: var(--sidebar-fg);
    --sidebar-ring: 212 95% 50%;

    /* Softer borders and shadows */
    --border-soft: hsl(var(--foreground) / 0.15);
  }
}

/* Professional typography with tabular numbers */
@layer base {
  body {
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
    font-variation-settings: 'opsz' 32;
  }
  
  .font-mono {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-feature-settings: 'tnum' 1, 'zero' 1;
  }
  
  /* Ensure tabular numbers for all price displays */
  .price-display,
  .currency-isk,
  [data-price],
  .font-mono {
    font-feature-settings: 'tnum' 1;
    font-variant-numeric: tabular-nums;
  }
}

/* Component Variants */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary-hover;
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
    @apply border border-foreground/10 shadow-soft;
  }
  
  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary-hover;
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
    @apply border border-foreground/10 shadow-soft;
  }
  
  .btn-accent {
    @apply bg-accent text-accent-foreground hover:bg-accent-hover;
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  }
  
  .data-table {
    @apply w-full border-collapse border border-table-border;
  }
  
  .data-table th {
    @apply bg-table-header text-left p-3 font-semibold text-sm;
    @apply border-b border-table-border;
  }
  
  .data-table td {
    @apply p-3 border-b border-table-border;
  }
  
  .data-table tr:hover {
    @apply bg-table-row-hover;
  }
  
  .price-badge-best {
    @apply bg-price-best/10 text-price-best border border-price-best/20;
    @apply px-2 py-1 rounded text-xs font-medium;
  }
  
  .price-badge-good {
    @apply bg-price-good/10 text-price-good border border-price-good/20;
    @apply px-2 py-1 rounded text-xs font-medium;
  }
  
  .price-badge-average {
    @apply bg-price-average/10 text-price-average border border-price-average/20;
    @apply px-2 py-1 rounded text-xs font-medium;
  }
  
  .price-badge-expensive {
    @apply bg-price-expensive/10 text-price-expensive border border-price-expensive/20;
    @apply px-2 py-1 rounded text-xs font-medium;
  }
  
  .vat-toggle-inclusive {
    @apply bg-vat-inclusive text-white;
  }
  
  .vat-toggle-exclusive {
    @apply bg-vat-exclusive text-white;
  }
  
  .card-elevated {
    @apply bg-card border border-border rounded-lg shadow-md;
  }
  
  .input-field {
    @apply bg-input border border-border rounded-md px-3 py-2;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent;
  }
  
  /* Softer table styling */
  .data-table {
    @apply w-full border-collapse border border-foreground/10 shadow-soft;
  }
  
  .data-table th {
    @apply bg-table-header text-left p-3 font-semibold text-sm;
    @apply border-b border-foreground/10;
  }
  
  .data-table td {
    @apply p-3 border-b border-foreground/10;
  }
}

/* Animations for professional feel */
@layer utilities {
  .animate-slide-up {
    animation: slideUp 0.2s ease-out;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.2s ease-out;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Iceland-specific formatting */
.currency-isk {
  font-variant-numeric: tabular-nums;
}

.currency-isk::after {
  content: ' kr';
  font-weight: normal;
  color: hsl(var(--muted-foreground));
}
/* --- Sidebar chrome fixes --- */

/* Ensure sidebar runs flush to the very top */
[data-sidebar="sidebar"] {
  top: 0 !important;
  margin-top: 0 !important;
}

/* Remove any accidental top border/stripe from the sidebar */
[data-sidebar="sidebar"] {
  border-top: 0 !important;
  box-shadow: none !important;
}
[data-sidebar="sidebar"]::before,
[data-sidebar="sidebar"]::after,
[data-sidebar="sidebar"] > .top-stripe,
[data-sidebar="sidebar"] [data-top-stripe] {
  content: none !important;
  display: none !important; /* hides any extra cyan stripe element if present */
}

/* Start the menu lower for visual balance (rail + full modes) */
:root {
  --sidebar-offset: clamp(20px, 9vh, 84px);      /* expanded */
  --sidebar-offset-rail: clamp(12px, 7vh, 56px); /* collapsed (icon-only) */
}

[data-sidebar="content"] {
  padding-top: var(--sidebar-offset);
}

[data-collapsible="icon"] [data-sidebar="content"] {
  padding-top: var(--sidebar-offset-rail);
}

```


---

## src\styles\globals.css

```css
:root{
  /* Brand gradient */
  --brand-from:#0B1220;
  --brand-via:#0E1B35;
  --brand-to:#0E2A5E;

  /* Signature accent ("memory stripe", focus, progress) */
  --brand-accent:#21D4D6;

  /* Text on dark */
  --text-on-dark:#E6EDF6;
  --text-subtle:#B9C2D0;

  /* Radius scale (non-default) */
  --radius-1:6px;   /* small buttons, inputs */
  --radius-2:12px;  /* chips, pills */
  --radius-3:18px;  /* big buttons, nav items */
  --radius-4:24px;  /* cards, search shell */
  --radius-pill:9999px;

  /* Motion */
  --dur-fast:120ms;
  --dur-base:200ms;
  --ease-snap:cubic-bezier(.22,1,.36,1);

  /* Header layout */
  --header-left:var(--sidebar-w);  /* set from sidebar width */

  /* Action colors */
  --button-primary:#0B5BD3;
  --button-primary-hover:#0A53C1;

  /* Availability badges */
  --badge-in-bg:#D6FBEF;
  --badge-in-text:#046C4E;
  --badge-out-bg:#FCE2E6;
  --badge-out-text:#8C1D2E;
  --badge-unknown-bg:#E8EEF7;
  --badge-unknown-text:#2B3A55;

  /* Memory stripe */
  --stripe-from:#22E0E0;
  --stripe-to:#12B6C5;
}

/* Reusable motif */
.memory-stripe{ height:2px; background:linear-gradient(90deg,var(--stripe-from),var(--stripe-to)); }

/* Numbers align perfectly in tables/badges */
.ui-numeric{ font-variant-numeric: tabular-nums; }

/* Lucide icons */
svg.lucide{ stroke-width:1.75; }
.icon-16{ width:16px; height:16px; }
.icon-18{ width:18px; height:18px; }
.icon-20{ width:20px; height:20px; }

/* Availability badges */
.badge{ display:inline-flex; align-items:center; gap:6px;
  height:24px; padding:0 10px; border-radius:var(--radius-pill);
  font-size:12.5px; line-height:1; font-weight:500;
}
.badge--in{ background:var(--badge-in-bg); color:var(--badge-in-text); }
.badge--out{ background:var(--badge-out-bg); color:var(--badge-out-text); }
.badge--unknown{ background:var(--badge-unknown-bg); color:var(--badge-unknown-text); }

```


---

## tailwind.config.ts

```ts
import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
        theme: {
                container: {
                        center: false,
                        padding: '0rem',
                        screens: {
                                '2xl': '100%'
                        }
                },
               extend: {
                        fontFamily: {
                                sans: ['var(--font-ui)'],
                                display: ['var(--font-display)'],
                        },
                        transitionDuration: {
                                120: '120ms',
                                base: 'var(--dur-base)',
                                fast: 'var(--dur-fast)',
                        },
                        transitionTimingFunction: {
                                snap: 'var(--ease-snap)',
                        },
                       colors: {
                               border: 'hsl(var(--border))',
                               input: 'hsl(var(--input))',
                               ring: 'hsl(var(--ring))',
                               background: 'hsl(var(--background))',
                               foreground: 'hsl(var(--foreground))',
                               sidebar: 'hsl(var(--sidebar))',
                               'sidebar-foreground': 'hsl(var(--sidebar-foreground))',
                               'sidebar-muted-foreground': 'hsl(var(--sidebar-muted-foreground))',
                               'sidebar-border': 'hsl(var(--sidebar-border))',
                               'sidebar-accent': 'hsl(var(--sidebar-accent))',
                               'sidebar-accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                               'sidebar-ring': 'hsl(var(--sidebar-ring))',
                               'brand-from': 'var(--brand-from)',
                               'brand-via': 'var(--brand-via)',
                               'brand-to': 'var(--brand-to)',
                               'brand-accent': 'var(--brand-accent)',
                               'text-on-dark': 'var(--text-on-dark)',
                               'text-subtle': 'var(--text-subtle)',
                               'button-primary': 'var(--button-primary)',
                               'button-primary-hover': 'var(--button-primary-hover)',
                                primary: {
                                        DEFAULT: 'hsl(var(--primary))',
                                        foreground: 'hsl(var(--primary-foreground))',
                                        hover: 'hsl(var(--primary-hover))',
                                },
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				// Iceland B2B specific colors
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-foreground))',
				},
				// Brand colors from specification
				brand: {
					50: '#ECF5F8',
					100: '#D6ECF2',
					200: '#B3DCE6',
					300: '#8FCBDD',
					400: '#5DB3CF',
					500: '#2D9BC0', // primary
					600: '#1D84A9',
					700: '#186C8B',
					800: '#12556E',
					900: '#0D3E51',
				},
				'accent-highlight': '#F2B04E',
				// VAT specific
				'vat-inclusive': 'hsl(var(--vat-inclusive))',
				'vat-exclusive': 'hsl(var(--vat-exclusive))',
				// Price comparison
				'price-best': 'hsl(var(--price-best))',
				'price-good': 'hsl(var(--price-good))',
				'price-average': 'hsl(var(--price-average))',
				'price-expensive': 'hsl(var(--price-expensive))',
				// Data table
				'table-header': 'hsl(var(--table-header))',
				'table-row-hover': 'hsl(var(--table-row-hover))',
				'table-border': 'hsl(var(--table-border))',
			},
                        borderRadius: {
                                lg: 'var(--radius)',
                                md: 'calc(var(--radius) - 2px)',
                                sm: 'calc(var(--radius) - 4px)',
                                1: 'var(--radius-1)',
                                2: 'var(--radius-2)',
                                3: 'var(--radius-3)',
                                4: 'var(--radius-4)',
                                pill: 'var(--radius-pill)'
                        },
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'slide-up': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-in': {
					from: {
						opacity: '0'
					},
					to: {
						opacity: '1'
					}
				},
				'scale-in': {
					from: {
						opacity: '0',
						transform: 'scale(0.98)'
					},
					to: {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'flyout': {
					'0%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'scale(0.8) translateY(-20px)'
					}
				},
                                'search-result-enter': {
                                        from: {
                                                opacity: '0',
                                                transform: 'scale(0.98) translateY(-4px)'
                                        },
                                        to: {
                                                opacity: '1',
                                                transform: 'scale(1) translateY(0)'
                                        }
                                },
                                'chip-bounce': {
                                        '0%': {
                                                transform: 'scale(0.95)'
                                        },
                                        '50%': {
                                                transform: 'scale(1.05)'
                                        },
                                        '100%': {
                                                transform: 'scale(1)'
                                        }
                                }
                        },
                        animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
                                'scale-in': 'scale-in 0.12s ease-out',
                                'flyout': 'flyout 0.15s ease-out',
                                'search-result-enter': 'search-result-enter 0.12s ease-out',
                                'chip-bounce': 'chip-bounce 0.25s ease-out',
                        },
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
			},
			fontFeatureSettings: {
				'tnum': '"tnum" 1',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'focus': '0 1px 0 #0000000A, 0 2px 8px #00000014',
			}
		}
	},
        plugins: [animatePlugin],
} satisfies Config;

```
