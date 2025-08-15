
import React, { useState } from 'react';
import { QuickSearch } from '@/components/quick/QuickSearch';
import { PantryLanes } from '@/components/quick/PantryLanes';
import { MiniCompareDrawer } from '@/components/quick/MiniCompareDrawer';
import { BasketDrawer } from '@/components/cart/BasketDrawer';
import VatToggle from '@/components/ui/VatToggle';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsProvider';
import { useCart } from '@/contexts/CartProvider';
import { ShoppingCart } from 'lucide-react';

type UserMode = 'just-order' | 'balanced' | 'analytical';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMode, setUserMode] = useState<UserMode>('just-order');
  const [compareItem, setCompareItem] = useState<string | null>(null);
  const { includeVat, setIncludeVat } = useSettings();
  const { getTotalItems, setIsDrawerOpen } = useCart();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleCompareItem = (itemId: string) => {
    setCompareItem(itemId);
  };

  const handleCloseCompare = () => {
    setCompareItem(null);
  };

  const basketItemCount = getTotalItems();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quick Order</h1>
          <p className="text-muted-foreground">
            Search and order from all your suppliers in one place
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
            <Button
              size="sm"
              variant={userMode === 'just-order' ? "default" : "ghost"}
              onClick={() => setUserMode('just-order')}
              className="px-3 py-1 text-xs"
            >
              Just Order
            </Button>
            <Button
              size="sm"
              variant={userMode === 'balanced' ? "default" : "ghost"}
              onClick={() => setUserMode('balanced')}
              className="px-3 py-1 text-xs"
            >
              Balanced
            </Button>
          </div>

          {/* VAT Toggle */}
          <VatToggle 
            includeVat={includeVat} 
            onToggle={setIncludeVat}
          />

          {/* Basket Button */}
          <Button
            variant="outline"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Basket · {basketItemCount}</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <QuickSearch
        value={searchQuery}
        onChange={handleSearchChange}
        onCompareItem={handleCompareItem}
        userMode={userMode}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          {searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Search results for "{searchQuery}" will appear here</p>
            </div>
          ) : (
            <PantryLanes
              onCompareItem={handleCompareItem}
              userMode={userMode}
            />
          )}
        </div>
      </div>

      {/* Mini Compare Drawer */}
      <MiniCompareDrawer
        itemId={compareItem}
        isOpen={compareItem !== null}
        onClose={handleCloseCompare}
      />

      {/* Basket Drawer */}
      <BasketDrawer />
    </div>
  );
};

export default Index;
