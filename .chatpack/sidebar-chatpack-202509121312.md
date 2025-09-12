# Sidebar ChatPack 2025-09-12T13:12:40.921Z

_Contains 16 file(s)._

---

## e2e\navigation.spec.ts

```ts
import { test, expect } from '@playwright/test';

// Already authenticated via global-setup storageState.

test('sidebar links route correctly', async ({ page }) => {
  await page.goto('/');

  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Compare', path: '/compare' },
    { label: 'Suppliers', path: '/suppliers' },
  ];

  for (const { label, path } of links) {
    await page.getByRole('link', { name: label }).click();
    if (path === '/') {
      await expect(page).toHaveURL(/\/$/);
    } else {
      await expect(page).toHaveURL(new RegExp(path));
    }
  }
});

test('catalog search flow', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page).toHaveURL(/catalog/);

  const searchBox = page.getByPlaceholder('Search products');
  await searchBox.fill('test');
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});

```


---

## package.json

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run build:extension && vite build",
    "build:dev": "npm run build:extension && vite build --mode development",
    "build:extension": "npm --prefix extension run build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run --maxWorkers=2",
    "test:e2e": "playwright test",
    "merge:mock-items": "node supabase/scripts/mergeMockItems.js",
    "db:seed:catalog": "node supabase/scripts/seedCatalog.js",
    "cache:images": "node supabase/scripts/cacheImages.js",
    "check:dupes": "tsx scripts/check-duplicates.ts",
    "chat:pack": "tsx tools/make-chatpack.ts --preset catalog",
    "chat:pack:sidebar": "tsx tools/make-chatpack.ts --preset sidebar",
    "chat:pack:cart": "tsx tools/make-chatpack.ts --preset cart",
    "chat:pack:topbar": "tsx tools/make-chatpack.ts --preset topbar",
    "chat:pack:suppliers": "tsx tools/make-chatpack.ts --preset suppliers",
    "chat:pack:all": "pnpm run chat:pack && pnpm run chat:pack:sidebar && pnpm run chat:pack:cart && pnpm run chat:pack:topbar && pnpm run chat:pack:suppliers"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.55.0",
    "@tanstack/react-query": "^5.83.0",
    "@tanstack/react-virtual": "^3.13.12",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "csv-parse": "^6.1.0",
    "date-fns": "^3.6.0",
    "dotenv": "^17.2.1",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "react-window": "^1.8.11",
    "recharts": "^2.15.4",
    "sharp": "^0.33.5",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "use-sync-external-store": "^1.5.0",
    "vaul": "^0.9.9",
    "zod": "^3.25.76",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@playwright/test": "^1.54.2",
    "@tailwindcss/typography": "^0.5.16",
    "@tanstack/react-query-devtools": "^5.85.3",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.7.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "@vitest/coverage-v8": "^3.2.4",
    "autoprefixer": "^10.4.21",
    "cheerio": "^1.1.2",
    "esbuild": "^0.25.9",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "fast-glob": "^3.3.3",
    "globals": "^15.15.0",
    "jsdom": "^26.1.0",
    "lovable-tagger": "^1.1.9",
    "pg-mem": "^3.0.5",
    "playwright": "^1.55.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.20.4",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "undici": "^7.15.0",
    "vite": "^5.4.19",
    "vitest": "^3.2.4"
  },
  "packageManager": "pnpm@10.14.0"
}

```


---

## src\components\layout\EnhancedAppSidebar.tsx

```tsx
import React from 'react'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'

type EnhancedAppSidebarProps = React.ComponentProps<typeof Sidebar>

export function EnhancedAppSidebar({ children, ...props }: EnhancedAppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent className="pt-[var(--sidebar-offset)] data-[collapsible=icon]:pt-[var(--sidebar-offset-rail)]">
        {children}
      </SidebarContent>
    </Sidebar>
  )
}

export default EnhancedAppSidebar


```


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

#catalogHeader,
[data-app-header="true"] {
  --hdr-h: var(--header-h, 56px);
  transform: translateY(calc(-1 * var(--hdr-p, 0) * var(--hdr-h)));
}

#catalogHeader::before,
[data-app-header="true"]::before {
  /* Remove pseudo-element overlay that obscured the page */
  content: none !important;
}

@media (prefers-reduced-motion: reduce){
  #catalogHeader,
  [data-app-header="true"]{
    transition:none;
  }
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

## src\router.test.ts

```ts
import { describe, it, expect } from 'vitest'
import { routes } from './router'

const appRoute = routes.find(r => r.path === '/')
if (!appRoute) {
  throw new Error('Root route not found')
}

const childPaths = new Set(
  (appRoute.children ?? []).map(r => (r.index ? '' : r.path))
)

const expectedPaths = ['', 'cart', 'compare', 'suppliers', 'pantry', 'price-history', 'discovery', 'admin']

describe('sidebar route definitions', () => {
  for (const p of expectedPaths) {
    it(`includes path "${p || '/'}"`, () => {
      expect(childPaths.has(p)).toBe(true)
    })
  }
  it('defines catalog route separately', () => {
    expect(routes.some(r => r.path === '/catalog')).toBe(true)
  })
})

describe('public auth routes', () => {
  it('does not gate reset-password route', () => {
    expect(childPaths.has('reset-password')).toBe(false)
  })
  it('does not gate forgot-password route', () => {
    expect(childPaths.has('forgot-password')).toBe(false)
  })
  it('defines reset-password route', () => {
    expect(routes.some(r => r.path === '/reset-password')).toBe(true)
  })
})

```


---

## src\router.tsx

```tsx

import { createBrowserRouter } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";
import Orders from "@/pages/Orders";
import Suppliers from "@/pages/Suppliers";
import Pantry from "@/pages/Pantry";
import Settings from "@/pages/Settings";
import PriceHistory from "@/pages/PriceHistory";
import Delivery from "@/pages/Delivery";
import Admin from "@/pages/Admin";
import Discovery from "@/pages/Discovery";
import CatalogPage from "@/pages/catalog/CatalogPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import ErrorPage from "@/pages/ErrorPage";
import NotFound from "@/pages/NotFound";
import { ExistingUserOnboarding } from "@/components/onboarding/ExistingUserOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const routes = [
  {
    path: "/",
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "cart",
        element: <Orders />,
      },
      {
        path: "compare",
        element: <Compare />,
      },
      {
        path: "suppliers",
        element: <Suppliers />,
      },
      {
        path: "pantry",
        element: <Pantry />,
      },
      {
        path: "price-history",
        element: <PriceHistory />,
      },
      {
        path: "discovery",
        element: <Discovery />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "delivery",
        element: <Delivery />,
      },
    ],
  },
  {
    path: "/catalog",
    element: (
      <AuthGate>
        <CatalogPage />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/onboarding",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/create",
    element: (
      <AuthGate>
        <OnboardingWizard />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/join",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

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
  --sidebar-offset: clamp(36px, 11vh, 112px);        /* expanded */
  --sidebar-offset-rail: clamp(24px, 9vh, 88px);     /* icon-only */
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
  --hdr-ms:220ms;
  --hdr-ease:cubic-bezier(.22,.61,.36,1);

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

[data-chrome-layer], #catalogHeader {
  transition: transform var(--hdr-ms) var(--hdr-ease), opacity var(--hdr-ms) var(--hdr-ease);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  [data-chrome-layer], #catalogHeader {
    transition: none;
  }
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

## src\styles\layout-vars.css

```css
:root {
  --layout-rail: 72px;     /* nav rail width */
  --header-h: 56px;        /* unified header height */
  --toolbar-h: var(--header-h); /* toolbar follows header */
  --chrome-h: var(--header-h);  /* chrome follows header */
  --header-left: var(--layout-rail);

  --z-rail: 60;   /* highest - sidebar always on top */
  --z-stripe: 56; /* cyan stripe above header */
  --z-header: 55;  /* header content on top */
  --z-chrome: 50;  /* chrome background below header */
}

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


---

## tools\make-chatpack.ts

```ts
// tools/make-chatpack.ts
import fg from 'fast-glob'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Usage (examples):
 *   pnpm dlx tsx tools/make-chatpack.ts --preset suppliers
 *   pnpm dlx tsx tools/make-chatpack.ts --preset topbar
 *   pnpm dlx tsx tools/make-chatpack.ts --preset sidebar
 *   pnpm dlx tsx tools/make-chatpack.ts --preset cart
 *   pnpm dlx tsx tools/make-chatpack.ts --preset catalog
 *
 * Optional flags:
 *   --keep 2   # keep the last 2 old packs for this preset (default 0 = delete all old)
 *
 * (optional) package.json scripts:
 *   "chat:pack:suppliers": "tsx tools/make-chatpack.ts --preset suppliers",
 *   "chat:pack:topbar":    "tsx tools/make-chatpack.ts --preset topbar",
 *   "chat:pack:sidebar":   "tsx tools/make-chatpack.ts --preset sidebar",
 *   "chat:pack:cart":      "tsx tools/make-chatpack.ts --preset cart",
 *   "chat:pack:catalog":   "tsx tools/make-chatpack.ts --preset catalog"
 */

type PresetConfig = {
  /** explicit file names or paths to include (exact path first, else basename search) */
  requested?: string[]
  /** glob patterns to include (to catch moved/renamed helpers) */
  patterns?: string[]
}

const PRESETS: Record<string, PresetConfig> = {
  // ——————————————————————————————————————————————————————————
  // SUPPLIERS
  // ——————————————————————————————————————————————————————————
  suppliers: {
    requested: [
      // Key pages & routing
      'src/pages/Suppliers.tsx',
      'src/router.tsx',
      'src/router.test.ts',

      // Supplier components (core)
      'src/components/suppliers/EnhancedSupplierManagement.tsx',
      'src/components/suppliers/SupplierManagement.tsx',
      'src/components/suppliers/SupplierList.tsx',
      'src/components/suppliers/SupplierCredentialsForm.tsx',
      'src/components/suppliers/IngestionRunsList.tsx',
      'src/components/suppliers/BookmarkletSync.tsx',
      'src/components/suppliers/SupplierItemsWithHarInfo.tsx',
      'src/components/suppliers/HarUploadModal.tsx',
      'src/components/suppliers/HarSyncStatus.tsx',
      'src/components/suppliers/HarAnalyticsPreview.tsx',
      'src/components/suppliers/HarProcessingPreview.tsx',

      // Docs
      'docs/CONNECTORS.md',

      // Ingestion entry points commonly referenced in prompts
      'ingestion/pipelines/innnes-upsert.ts',
      'ingestion/runner.ts',
      'ingestion/types.ts',

      // Seeds & scripts
      'scripts/seedCatalog.ts',
      'supabase/scripts/seedCatalog.js',
      'supabase/seed/dev_seed.sql',
    ],
    patterns: [
      // Components referencing supplier data outside suppliers/
      'src/components/catalog/*Supplier*.tsx',
      'src/components/catalog/**/__tests__/*Supplier*.test.tsx',
      'src/components/catalog/Supplier*.tsx',
      'src/components/catalog/CatalogTable.tsx',
      'src/components/catalog/CatalogTable.test.tsx',
      'src/components/catalog/CatalogFiltersPanel.tsx',
      'src/components/catalog/FacetPanel.tsx',

      'src/components/cart/**/*.{ts,tsx}',
      'src/components/compare/**/*.{ts,tsx}',
      'src/components/dashboard/**/*{Supplier*,Connector*,Anomaly*,Health*}.{ts,tsx}',
      'src/components/orders/**/*{Supplier*,Order*}.{ts,tsx}',
      'src/components/onboarding/steps/*Supplier*.tsx',
      'src/components/search/*{HeaderSearch,SearchResultsPopover,SearchInput}*.tsx',

      // Hooks, contexts, services, state, lib, utils
      'src/contexts/**/BasketProvider.tsx',
      'src/contexts/**/BasketProvider.test.tsx',
      'src/hooks/**/useSupplier*.ts*',
      'src/hooks/**/useEnhancedSupplier*.ts*',
      'src/hooks/**/useOptimizedSupplier*.ts*',
      'src/hooks/**/useDeliveryAnalytics.tsx',
      'src/hooks/**/useOrderingSuggestions.tsx',
      'src/services/**/{DeliveryCalculator,DeliveryRules,OrderingSuggestions}.ts',
      'src/services/**/{DeliveryCalculator,OrderingSuggestions}.test.ts',
      'src/state/{catalogFiltersStore,userPrefs}.ts*',
      'src/lib/{catalogFilters,catalogState,queryKeys,landedCost,normalization}.ts',
      'src/utils/{harAnalytics,harDataExtractor,harRecommendations}.ts',

      // Ingestion adapters/extractors
      'ingestion/extractors/innnes-cheerio.ts',
      'ingestion/adapters/**/*.{ts,tsx}',
      'ingestion/adapters/{csv-bar.ts,sitemap-baz.ts,api-foo.ts}',

      // E2E tests
      'e2e/navigation.spec.ts',
      'e2e/header-stability.spec.ts',

      // Supabase Edge Functions
      'supabase/functions/{ingest-supplier,ingest-supplier-products,match-supplier-item,schedule-supplier-ingestion,job-processor,ingest_har,stale-sweep}/**/*.{ts,tsx,js,json}',
      'supabase/functions/ingest-supplier/availability.test.ts',

      // Supabase migrations (many supplier-related)
      'supabase/migrations/**/*supplier*.sql',
      'supabase/migrations/**/*ingest*.sql',
      'supabase/migrations/**/*supplier*_*.sql',

      // Docs with supplier mentions
      'docs/**/{README,SECURITY,hardcode-inventory,dashboard-pantry-mock-inventory,duplication-audit}.md',

      // Top-level refs
      'package.json',
      'README.md',
      'AUDIT/**/*',
      'tools/make-chatpack.ts',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // CATALOG
  // ——————————————————————————————————————————————————————————
  catalog: {
    requested: [
      // Page entry & state
      'src/pages/catalog/CatalogPage.tsx',
      'src/pages/catalog/useCatalogState.ts',
      'src/pages/catalog/ZeroResultsRescue.tsx',
      'src/pages/catalog/CatalogPage.test.tsx',

      // Supporting layout/UI pieces explicitly called out
      'src/components/layout/CatalogLayout.tsx',
      'src/components/ui/filter-chip.tsx',
      'src/components/ui/tri-state-chip.tsx',
      'src/components/ui/tri-state-chip.test.tsx',
      'src/components/search/HeroSearchInput.tsx',
      'src/components/common/InfiniteSentinel.tsx',
      'src/components/place-order/ViewToggle.tsx',

      // Hooks & state
      'src/hooks/useCatalogProducts.ts',
      'src/hooks/useOrgCatalog.ts',
      'src/hooks/useCatalogSearchSuggestions.ts',
      'src/state/catalogFiltersStore.ts',
      'src/state/catalogFiltersStore.test.ts',

      // Lib modules
      'src/lib/catalogFilters.ts',
      'src/lib/catalogState.ts',
      'src/lib/scrollMemory.ts',
      'src/lib/analytics.ts',
      'src/lib/images.ts',

      // Service layer
      'src/services/catalog.ts',
      'src/services/__tests__/Catalog.test.ts',
    ],
    patterns: [
      // Catalog components
      'src/components/catalog/**/*.{ts,tsx,css}',
      'src/components/catalog/**/__tests__/**/*.{ts,tsx}',

      // Page dir
      'src/pages/catalog/**/*.{ts,tsx,css}',

      // Hooks & lib (catch moved/renamed)
      'src/hooks/**/useCatalog*.ts*',
      'src/hooks/**/useOrgCatalog*.ts*',
      'src/lib/**/catalog*.ts*',

      // Shared helpers that catalog uses
      'src/components/ui/{filter-chip,tri-state-chip}.ts*',
      'src/components/common/InfiniteSentinel.tsx',
      'src/components/place-order/ViewToggle.tsx',

      // Virtualization
      'src/components/catalog/VirtualizedGrid.tsx',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // SIDEBAR
  // ——————————————————————————————————————————————————————————
  sidebar: {
    requested: [
      // Core UI building blocks
      'src/components/ui/sidebar.tsx',
      'src/components/ui/sidebar-provider.tsx',
      'src/components/ui/use-sidebar.ts',
      'src/components/ui/sidebar-constants.ts',

      // Layout / specialized sidebars
      'src/components/layout/EnhancedAppSidebar.tsx',
      'src/components/quick/SmartCartSidebar.tsx',

      // Styling & configuration
      'src/index.css',
      'src/styles/design-system.css',
      'src/styles/globals.css',
      'src/styles/layout-vars.css',
      'tailwind.config.ts',

      // Tests / routing
      'e2e/navigation.spec.ts',
      'src/router.test.ts',

      // Tooling
      'tools/make-chatpack.ts',
      'package.json',
    ],
    patterns: [
      // Any sidebar-related UI files
      'src/components/ui/*sidebar*.{ts,tsx}',
      'src/components/ui/sidebar*.{ts,tsx}',
      'src/components/layout/*Sidebar*.tsx',
      'src/components/quick/*Sidebar*.tsx',

      // Styles affecting sidebar layout/tokens
      'src/styles/*{design-system,globals,layout-vars}*.css',
      'src/**/*.css',

      // Navigation tests & router
      'e2e/**/navigation.spec.ts',
      'src/**/router*.{ts,tsx,test.tsx}',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // CART (kept minimal; updated to common current filenames)
  // ——————————————————————————————————————————————————————————
  cart: {
    requested: [
      'src/contexts/BasketProvider.tsx',
      'src/hooks/useBasket.ts',
      'src/components/cart/AddToCartButton.tsx',
      'src/components/cart/CartDrawer.tsx',
      'src/components/cart/QuantityStepper.tsx',
      'src/components/cart/flyToCart.ts',
      'src/components/orders/OrderComposer.tsx',
      'src/hooks/useOrderingSuggestions.tsx',
      'src/hooks/useDeliveryOptimization.tsx',
      'src/services/DeliveryCalculator.ts',
      'src/index.css',
    ],
    patterns: [
      'src/components/cart/**/*.{ts,tsx}',
      'src/components/orders/**/*{Order*,Composer*}.{ts,tsx}',
      'src/hooks/**/use*Cart*.ts*',
      'src/hooks/**/useOrderingSuggestions.tsx',
      'src/hooks/**/useDeliveryOptimization.tsx',
      'src/services/**/DeliveryCalculator.ts',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // TOP BAR / HEADER
  // ——————————————————————————————————————————————————————————
  topbar: {
    requested: [
      // Docs / manifest
      'TOPBAR_MANIFEST.md',

      // Core components
      'src/components/layout/TopNavigation.tsx',
      'src/components/layout/AppChrome.tsx',
      'src/components/layout/AppLayout.tsx',
      'src/components/layout/FullWidthLayout.tsx',
      'src/components/layout/ElevationBanner.tsx',

      // Switchers & search
      'src/components/layout/TenantSwitcher.tsx',
      'src/components/layout/LanguageSwitcher.tsx',
      'src/components/search/HeaderSearch.tsx',

      // Scroll-hide behavior (+test)
      'src/components/layout/useHeaderScrollHide.ts',
      'src/components/layout/useHeaderScrollHide.test.tsx',

      // Styling / globals
      'src/styles/layout-vars.css',
      'src/styles/globals.css',
      'src/index.css',
    ],
    patterns: [
      'src/components/layout/*{TopNavigation,AppChrome,AppLayout,FullWidthLayout,ElevationBanner}*.tsx',
      'src/components/layout/*Header*.ts*',
      'src/components/search/*HeaderSearch*.tsx',
      'src/styles/*{layout-vars,globals}*.css',
      'src/**/*catalogHeader*', // catch/remove legacy overlay refs if still present
    ],
  },
}

// folders to ignore while searching
const IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.chatpack/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.vercel/**',
]

// when multiple files share a basename, prefer these roots
const PREFER = [
  'src/pages/**',
  'src/components/layout/**',
  'src/components/ui/**',
  'src/components/quick/**',
  'src/components/**',
  'src/contexts/**',
  'src/hooks/**',
  'src/layout/**',
  'src/services/**',
  'src/lib/**',
  'src/styles/**',
  'components/**',
  'pages/**',
  'app/**',
  'styles/**',
  '**', // fallback
]

function parseArg(name: string, fallback?: string) {
  const i = process.argv.findIndex(a => a === `--${name}`)
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1]
  return fallback
}

function langFor(p: string) {
  const lower = p.toLowerCase()
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.tsx')) return 'tsx'
  if (lower.endsWith('.ts')) return 'ts'
  if (lower.endsWith('.js')) return 'js'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.sql')) return 'sql'
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'md'
  return ''
}

async function exists(p: string) {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

function rank(p: string): number {
  const norm = p.replace(/\\/g, '/')
  for (let i = 0; i < PREFER.length; i++) {
    const pat = PREFER[i].replace('/**', '')
    if (norm.includes(pat.replace('**', ''))) return i
  }
  return 999
}

async function findByRequested(request: string): Promise<string[]> {
  // 1) exact hit
  if (await exists(request)) return [path.normalize(request)]

  // 2) basename search
  const base = path.basename(request)
  if (!base) return []
  const matches = await fg([`**/${base}`], { ignore: IGNORE, dot: false })
  if (matches.length === 0) return []

  const sorted = matches.sort((a, b) => rank(a) - rank(b))
  const seen = new Set<string>()
  const uniq: string[] = []
  for (const m of sorted) {
    const abs = path.normalize(m)
    if (!seen.has(abs)) {
      seen.add(abs)
      uniq.push(abs)
    }
  }
  return uniq
}

async function collectFiles(preset: PresetConfig): Promise<string[]> {
  const files: string[] = []

  if (preset.patterns && preset.patterns.length) {
    const patFiles = await fg(preset.patterns, { ignore: IGNORE, dot: false })
    files.push(...patFiles.map(p => path.normalize(p)))
  }

  if (preset.requested && preset.requested.length) {
    for (const req of preset.requested) {
      const found = await findByRequested(req)
      if (found.length === 0) {
        console.warn('⚠️  Not found:', req)
        continue
      }
      files.push(...found)
    }
  }

  // de-dup + sort
  return Array.from(new Set(files)).sort((a, b) => a.localeCompare(b))
}

function timestamp() {
  // YYYYMMDDHHMM (windows-safe)
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
}

async function cleanOldPacks(outDir: string, presetName: string, keep = 0) {
  const pattern = `${outDir}/${presetName}-chatpack-*.md`
  const matches = (await fg([pattern], { dot: false })).sort()
  if (matches.length === 0) return []

  const toDelete = keep > 0 ? matches.slice(0, Math.max(0, matches.length - keep)) : matches
  await Promise.allSettled(toDelete.map(p => fs.unlink(p)))
  return toDelete
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function run() {
  const presetName = parseArg('preset', 'catalog') ?? 'catalog'
  const keepStr = parseArg('keep', '0') ?? '0'
  const keep = Math.max(0, Number.isFinite(Number(keepStr)) ? Number(keepStr) : 0)

  const cfg = PRESETS[presetName]
  if (!cfg) {
    console.error(`Unknown preset "${presetName}". Available: ${Object.keys(PRESETS).join(', ')}`)
    process.exit(1)
  }

  const files = await collectFiles(cfg)

  const outDir = '.chatpack'
  await fs.mkdir(outDir, { recursive: true })

  // delete older packs for this preset (keep N if requested)
  const deleted = await cleanOldPacks(outDir, presetName, keep)
  if (deleted.length) {
    console.log(`Deleted ${deleted.length} old pack(s) for "${presetName}".`)
  }

  const stamp = timestamp()
  const outPath = `${outDir}/${presetName}-chatpack-${stamp}.md`

  let out = `# ${capitalize(presetName)} ChatPack ${new Date().toISOString()}\n\n_Contains ${files.length} file(s)._`

  for (const p of files) {
    const code = await fs.readFile(p, 'utf8').catch(() => `/* ERROR: Could not read ${p} */`)
    const fence = langFor(p)
    out += `\n\n---\n\n## ${p}\n\n\`\`\`${fence}\n${code}\n\`\`\`\n`
  }

  await fs.writeFile(outPath, out, 'utf8')
  console.log(`Wrote ${outPath} with ${files.length} file(s)`)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})

```
