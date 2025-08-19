import { Home, TrendingUp, Package, ShoppingCart, History, Building2, Search, Heart, Shield, Truck, Zap } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { useBasket } from "@/contexts/BasketProvider"
import { usePermissions } from "@/hooks/usePermissions"

// Core workflow pages
const coreItems = [
  {
    title: "Quick Order",
    url: "/quick-order",
    icon: Zap,
    description: "Fast ordering hub"
  },
  {
    title: "Basket",
    url: "/basket",
    icon: ShoppingCart,
    description: "Current basket & orders"
  },
  {
    title: "Compare",
    url: "/compare",
    icon: TrendingUp,
    description: "Price comparison"
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Package,
    description: "Supplier management"
  }
]

// Exploration and analysis pages
const exploreItems = [
  {
    title: "Pantry",
    url: "/pantry",
    icon: Heart,
    description: "Favorites & guides"
  },
  {
    title: "Price History",
    url: "/price-history",
    icon: History,
    description: "Historical data"
  },
  {
    title: "Discovery",
    url: "/discovery",
    icon: Search,
    description: "Find new products"
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
  const currentTenantMembership = memberships?.find(m => m.tenant_id === profile?.tenant_id)
  const isAdmin = currentTenantMembership?.base_role === 'admin' || currentTenantMembership?.base_role === 'owner'
  
  const basketItemCount = getTotalItems()
  
  // Get display name with fallbacks
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Iceland B2B</h2>
          <p className="text-sm text-muted-foreground">Wholesale Platform</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core Workflow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="w-full">
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} className="w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start">
                              <span>{item.title}</span>
                              {item.description && (
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                              )}
                            </div>
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

        <SidebarGroup>
          <SidebarGroupLabel>Explore & Analyze</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="w-full">
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} className="w-full">
                        <div className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          <div className="flex flex-col items-start">
                            <span>{item.title}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            )}
                          </div>
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
              <SidebarMenu>
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
  )
}
