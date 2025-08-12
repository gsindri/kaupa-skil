
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import VatToggle from '../ui/VatToggle';
import PriceBadge from '../ui/PriceBadge';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface PriceItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  suppliers: {
    name: string;
    sku: string;
    packSize: string;
    priceExVat: number;
    priceIncVat: number;
    pricePerUnit: number;
    pricePerUnitIncVat: number;
    inStock: boolean;
    lastUpdated: string;
    badge?: 'best' | 'good' | 'average' | 'expensive';
  }[];
}

const PriceComparisonTable: React.FC = () => {
  const [includeVat, setIncludeVat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const priceItems: PriceItem[] = [
    {
      id: '1',
      name: 'Extra Virgin Olive Oil',
      brand: 'Bertolli',
      category: 'Cooking Oils',
      unit: 'L',
      suppliers: [
        {
          name: 'Véfkaupmenn',
          sku: 'VK-OLV-001',
          packSize: '500ml bottle',
          priceExVat: 1890,
          priceIncVat: 2344,
          pricePerUnit: 3780,
          pricePerUnitIncVat: 4688,
          inStock: true,
          lastUpdated: '2 hours ago',
          badge: 'good',
        },
        {
          name: 'Heilsuhúsið',
          sku: 'HH-OLIV-500',
          packSize: '500ml bottle',
          priceExVat: 1650,
          priceIncVat: 2046,
          pricePerUnit: 3300,
          pricePerUnitIncVat: 4092,
          inStock: true,
          lastUpdated: '4 hours ago',
          badge: 'best',
        },
        {
          name: 'Matfuglinn',
          sku: 'MF-500-OLV',
          packSize: '500ml bottle',
          priceExVat: 2100,
          priceIncVat: 2604,
          pricePerUnit: 4200,
          pricePerUnitIncVat: 5208,
          inStock: false,
          lastUpdated: '1 day ago',
          badge: 'expensive',
        },
      ],
    },
    {
      id: '2',
      name: 'Icelandic Skyr Plain',
      brand: 'Ísey',
      category: 'Dairy',
      unit: 'kg',
      suppliers: [
        {
          name: 'Véfkaupmenn',
          sku: 'VK-SKYR-1KG',
          packSize: '1kg container',
          priceExVat: 890,
          priceIncVat: 987,
          pricePerUnit: 890,
          pricePerUnitIncVat: 987,
          inStock: true,
          lastUpdated: '1 hour ago',
          badge: 'average',
        },
        {
          name: 'Heilsuhúsið',
          sku: 'HH-SKYR-PLAIN',
          packSize: '1kg container',
          priceExVat: 850,
          priceIncVat: 943,
          pricePerUnit: 850,
          pricePerUnitIncVat: 943,
          inStock: true,
          lastUpdated: '3 hours ago',
          badge: 'best',
        },
      ],
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-xl font-semibold">Price Comparison</CardTitle>
            <div className="flex items-center space-x-4">
              <VatToggle includeVat={includeVat} onToggle={setIncludeVat} />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands, or SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="default">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add to Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price Comparison Table */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-64">Product</th>
                  <th>Supplier</th>
                  <th>SKU</th>
                  <th>Pack Size</th>
                  <th className="text-right">Price per Pack</th>
                  <th className="text-right">Price per {includeVat ? 'Unit (inc VAT)' : 'Unit (ex VAT)'}</th>
                  <th>Stock</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {priceItems.map((item) => (
                  item.suppliers.map((supplier, supplierIndex) => (
                    <tr key={`${item.id}-${supplierIndex}`} className="animate-fade-in">
                      {supplierIndex === 0 && (
                        <td rowSpan={item.suppliers.length} className="border-r border-table-border">
                          <div>
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.brand}</div>
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="font-medium text-foreground">{supplier.name}</div>
                      </td>
                      <td>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{supplier.sku}</code>
                      </td>
                      <td>
                        <span className="text-sm text-foreground">{supplier.packSize}</span>
                      </td>
                      <td className="text-right">
                        <div className="font-medium currency-isk">
                          {formatPrice(includeVat ? supplier.priceIncVat : supplier.priceExVat)}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-medium currency-isk">
                            {formatPrice(includeVat ? supplier.pricePerUnitIncVat : supplier.pricePerUnit)}
                          </span>
                          <span className="text-xs text-muted-foreground">/{item.unit}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          supplier.inStock 
                            ? 'bg-success/10 text-success' 
                            : 'bg-error/10 text-error'
                        }`}>
                          {supplier.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">{supplier.lastUpdated}</span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {supplier.badge && (
                            <PriceBadge type={supplier.badge}>
                              {supplier.badge === 'best' ? 'Best Price' :
                               supplier.badge === 'good' ? 'Good Deal' :
                               supplier.badge === 'average' ? 'Average' :
                               'Expensive'}
                            </PriceBadge>
                          )}
                          <Button size="sm" variant="ghost">
                            Add
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceComparisonTable;
