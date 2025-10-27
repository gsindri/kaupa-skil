import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { cn } from '@/lib/utils'

interface PublicNavigationProps {
  catalogVisible?: boolean
  onLockChange?: (locked: boolean) => void
}

/**
 * Public navigation for unauthenticated users
 * Shows: Logo, Explore catalog button, Log in button
 */
export const PublicNavigation = React.forwardRef<HTMLElement, PublicNavigationProps>(
  ({ catalogVisible, onLockChange }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "transition-shadow duration-300",
          catalogVisible ? "shadow-md" : "shadow-sm"
        )}
        style={{
          paddingLeft: 'var(--layout-rail, 72px)'
        }}
      >
      <div
        className="mx-auto flex h-20 w-full items-center justify-between"
        style={{
          maxWidth: '1600px',
          paddingInline: 'clamp(1.5rem, 4vw, 4rem)'
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <HeildaLogo />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher
            triggerClassName="text-foreground [--nav-text-color:hsl(var(--foreground))] [--nav-text-strong-color:hsl(var(--foreground))] [--nav-text-caret-color:hsl(var(--muted-foreground))]"
            labelClassName="text-foreground"
            caretClassName="text-muted-foreground"
          />
          
          <Button asChild variant="ghost">
            <Link to="/catalog">Explore catalog</Link>
          </Button>
          
          <Button asChild variant="default">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </header>
  )
})

PublicNavigation.displayName = 'PublicNavigation'
