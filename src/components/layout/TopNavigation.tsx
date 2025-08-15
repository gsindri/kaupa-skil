
import React from 'react'
import { Search, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { useLocation } from 'react-router-dom'
import VatToggle from '@/components/ui/VatToggle'

export function TopNavigation() {
  const { profile, signOut } = useAuth()
  const { includeVat, setIncludeVat } = useSettings()
  const location = useLocation()
  const isQuickOrderPage = location.pathname === '/'

  return (
    <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Tenant switcher and conditional search */}
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          {/* Tenant Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <span className="font-medium">Iceland B2B</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Iceland B2B</span>
                  <span className="text-sm text-muted-foreground">Current organization</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-sm text-muted-foreground">Switch organization</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Search - only show when NOT on Quick Order page */}
          {!isQuickOrderPage && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, suppliers, orders..."
                className="pl-10"
              />
            </div>
          )}
        </div>

        {/* Right side - VAT toggle, help, user menu */}
        <div className="flex items-center space-x-4">
          {/* VAT Toggle - visible on every page */}
          <VatToggle
            includeVat={includeVat}
            onToggle={setIncludeVat}
            className="hidden sm:flex"
          />

          {/* Help */}
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Help</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:inline font-medium">{profile?.full_name || 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">{profile?.full_name || 'User'}</span>
                  <span className="text-sm text-muted-foreground">{profile?.email}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Organization Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
