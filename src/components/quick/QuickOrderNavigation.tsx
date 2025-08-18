
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShoppingCart, User, Settings, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { BasketDrawer } from '@/components/cart/BasketDrawer'
import { HeildaLogo } from '@/components/branding/HeildaLogo'

export function QuickOrderNavigation() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-4">
          <HeildaLogo className="h-6 w-auto" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            className="gap-2"
          >
            <Menu className="h-4 w-4" />
            Menu
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            <Badge variant="secondary" className="ml-1">0</Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">
                  {user?.full_name || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <BasketDrawer />
    </>
  )
}
