
import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Toaster } from '@/components/ui/toaster'
import { ElevationBanner } from '@/components/admin/ElevationBanner'
import { SupportSessionBanner } from '@/components/admin/SupportSessionBanner'

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
            </div>
          </div>
          <div className="p-4">
            <ElevationBanner />
            <SupportSessionBanner />
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
