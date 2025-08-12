
import React from 'react';
import { Building2, ShoppingCart, TrendingUp, Settings, Users, Package } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentPage = 'dashboard' }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, href: '/' },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, href: '/suppliers' },
    { id: 'catalog', label: 'Catalog', icon: Package, href: '/catalog' },
    { id: 'compare', label: 'Compare Prices', icon: TrendingUp, href: '/compare' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/orders' },
    { id: 'team', label: 'Team', icon: Users, href: '/team' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Iceland B2B</h1>
              <p className="text-xs text-muted-foreground">Wholesale Comparison</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Currency:</span>
              <span className="font-medium text-foreground">ISK</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-sm font-medium text-accent">RH</span>
              </div>
              <div className="hidden md:block text-sm">
                <div className="font-medium text-foreground">Restaurant Hótel</div>
                <div className="text-muted-foreground">iceland-restaurant.is</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
