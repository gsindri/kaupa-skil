import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HeildaLogo } from '@/components/branding/HeildaLogo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

/**
 * Public navigation for unauthenticated users
 * Shows: Logo, Explore catalog button, Log in button
 */
export function PublicNavigation() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="public-shell flex h-20 w-full items-center justify-between">
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
}
