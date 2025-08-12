
import React, { useState } from 'react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import PriceComparisonTable from '../components/compare/PriceComparisonTable';
import { Button } from '../components/ui/button';
import { TrendingUp, Package, Building2, ShoppingCart } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'compare'>('dashboard');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentView === 'dashboard' ? 'Dashboard' : 'Price Comparison'}
          </h1>
          <p className="text-muted-foreground">
            {currentView === 'dashboard' 
              ? 'Overview of your wholesale procurement activity'
              : 'Compare prices across your authorized suppliers'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant={currentView === 'compare' ? 'default' : 'outline'}
            onClick={() => setCurrentView('compare')}
            className="flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Compare Prices</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {currentView === 'dashboard' ? (
        <DashboardOverview />
      ) : (
        <PriceComparisonTable />
      )}

      {/* Quick Actions Footer */}
      <div className="mt-8 p-6 bg-card border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Add Supplier</div>
              <div className="text-xs text-muted-foreground">Connect to new wholesale portal</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex items-center space-x-3">
            <Package className="h-5 w-5 text-accent" />
            <div className="text-left">
              <div className="font-medium">Import Price List</div>
              <div className="text-xs text-muted-foreground">Upload CSV/XLSX catalog</div>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex items-center space-x-3">
            <ShoppingCart className="h-5 w-5 text-success" />
            <div className="text-left">
              <div className="font-medium">Create Order</div>
              <div className="text-xs text-muted-foreground">Start new purchase order</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
