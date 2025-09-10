
import {
  Home,
  TrendingUp,
  Package,
  History,
  Search,
  Heart,
  Shield,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router-dom"
import { useAuth } from '@/contexts/useAuth'
import { usePermissions } from "@/hooks/usePermissions"
import { HeildaLogo } from "@/components/branding/HeildaLogo"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/use-sidebar"

// Core workflow pages
const coreItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Catalog",
    url: "/catalog",
    icon: Search,
  },
  {
    title: "Compare",
    url: "/compare",
    icon: TrendingUp,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Package,
  }
]

// Exploration and analysis pages
const exploreItems = [
  {
    title: "Pantry",
    url: "/pantry",
    icon: Heart,
  },
  {
    title: "Price History",
    url: "/price-history",
    icon: History,
  },
  {
    title: "Discovery",
    url: "/discovery",
    icon: Search,
  },
]

const adminItems = [
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
  },
]

export function EnhancedAppSidebar() {
  const { profile, user } = useAuth()
  const { memberships } = usePermissions()
  const { open, openMobile, isMobile } = useSidebar()
  const sidebarOpen = isMobile ? openMobile : open

  // Check if user has admin access by looking at their memberships
  const currentTenantMembership = memberships?.find(
    (m) => m.tenant_id === profile?.tenant_id,
  )
  const isAdmin =
    currentTenantMembership?.base_role === "admin" ||
    currentTenantMembership?.base_role === "owner"

  // Get display name with fallbacks
  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User"

  return (
    <nav aria-label="Primary" id="app-sidebar" className="h-full">
        {/* Remove hardcoded w-64 class to allow dynamic width management */}
        <Sidebar collapsible="icon">
        <SidebarHeader>
          <NavLink
            to="/"
            className={`block p-4 transition-all duration-150 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 -translate-y-1 pointer-events-none'
            }`}
            aria-hidden={!sidebarOpen}
            tabIndex={sidebarOpen ? 0 : -1}
          >
            <HeildaLogo className="h-7 w-auto" />
          </NavLink>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-2 pb-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="w-full">
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} className="w-full">
                        <div className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        <Separator className="my-4 mx-2" />

        <SidebarGroup className="p-2 pt-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="w-full">
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} className="w-full">
                        <div className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink to={item.url} className="w-full">
                      {({ isActive }) => (
                        <SidebarMenuButton asChild isActive={isActive} className="w-full">
                          <div className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-sm text-muted-foreground">
          Welcome, {displayName}
        </div>
      </SidebarFooter>
      </Sidebar>
    </nav>
  )
}
