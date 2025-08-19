import {
  Home,
  TrendingUp,
  Package,
  ShoppingCart,
  History,
  Building2,
  Search,
  Heart,
  Shield,
  Truck,
  Zap,
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
import { Badge } from "@/components/ui/badge"
import { useBasket } from '@/contexts/useBasket'
import { usePermissions } from "@/hooks/usePermissions"
import { HeildaLogo } from "@/components/branding/HeildaLogo"
import { Separator } from "@/components/ui/separator"

// Core workflow pages
const coreItems = [
  {
    title: "Place Order",
    url: "/quick-order",
    icon: Zap,
  },
  {
    title: "Basket",
    url: "/basket",
    icon: ShoppingCart,
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
  const { getTotalItems } = useBasket()
  const { memberships } = usePermissions()

  // Check if user has admin access by looking at their memberships
  const currentTenantMembership = memberships?.find(
    (m) => m.tenant_id === profile?.tenant_id,
  )
  const isAdmin =
    currentTenantMembership?.base_role === "admin" ||
    currentTenantMembership?.base_role === "owner"

  const basketItemCount = getTotalItems()

  // Get display name with fallbacks
  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User"

  return (
    <nav aria-label="Primary" className="h-full">
      <Sidebar>
        <SidebarHeader>
          <NavLink to="/" className="block p-4">
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
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          {item.title === "Basket" && basketItemCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-2 font-mono"
                              style={{ fontFeatureSettings: '"tnum" 1' }}
                            >
                              {basketItemCount}
                            </Badge>
                          )}
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
