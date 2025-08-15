
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
import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { useBasket } from "@/contexts/BasketProvider"

// Core workflow pages
const coreItems = [
  {
    title: "Quick Order",
    url: "/",
    icon: Zap,
    description: "Fast ordering hub"
  },
  {
    title: "Basket",
    url: "/orders",
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
  const location = useLocation()
  const { profile } = useAuth()
  const { getTotalItems } = useBasket()

  // Check if user has admin access
  const isAdmin = profile?.role === 'admin'
  const basketItemCount = getTotalItems()

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
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url} className="flex items-center justify-between w-full">
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
                        <Badge variant="secondary" className="ml-2 font-mono" style={{ fontFeatureSettings: '"tnum" 1' }}>
                          {basketItemCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
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
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <div className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span>{item.title}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </SidebarMenuButton>
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
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-sm text-muted-foreground">
          {profile?.full_name || 'User'}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
