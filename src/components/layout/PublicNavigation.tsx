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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <HeildaLogo />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
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
