
import { Home, TrendingUp, Package, ShoppingCart, History, Building2, Search, Heart, Shield } from "lucide-react"
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
import { useCart } from "@/contexts/CartProvider"

const mainItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Compare",
    url: "/compare",
    icon: TrendingUp,
  },
  {
    title: "Pantry",
    url: "/pantry",
    icon: Heart,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Price History",
    url: "/price-history",
    icon: History,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Package,
  },
]

const optionalItems = [
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
  const location = useLocation()
  const { profile } = useAuth()
  const { getTotalItems } = useCart()

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url} className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.title === "Orders" && basketItemCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
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
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {optionalItems.map((item) => (
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
