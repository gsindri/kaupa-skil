import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Package,
  Clock,
  Users,
  Zap
} from 'lucide-react'
import { useCart } from '@/contexts/BasketProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { ItemCard } from '@/components/quick/ItemCard'
import { SmartSuggestions } from '@/components/quick/SmartSuggestions'
import { EnhancedCartIntegration } from '@/components/quick/EnhancedCartIntegration'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { SmartCartSidebar } from '@/components/quick/SmartCartSidebar'
import { PantryLanes } from '@/components/quick/PantryLanes'
import { CompactOrderGuidesCTA } from '@/components/quick/CompactOrderGuidesCTA'
import { PerformanceOptimizedList } from '@/components/quick/PerformanceOptimizedList'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { QuickOrderErrorFallback } from '@/components/quick/QuickOrderErrorFallback'

interface Item {
  id: string
  name: string
  brand: string
  packSize: string
  unitPriceExVat: number
  unitPriceIncVat: number
  packPriceExVat: number
  packPriceIncVat: number
  unit: string
  suppliers: string[]
  stock: boolean
  deliveryFee?: number
  cutoffTime?: string
  deliveryDay?: string
  isPremiumBrand?: boolean
  isDiscounted?: boolean
  originalPrice?: number
}

const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Organic Apples',
    brand: 'FreshFarm',
    packSize: '1kg bag',
    unitPriceExVat: 250,
    unitPriceIncVat: 310,
    packPriceExVat: 250,
    packPriceIncVat: 310,
    unit: 'kg',
    suppliers: ['Metro', 'Costco'],
    stock: true,
    deliveryFee: 500,
    cutoffTime: '14:00',
    deliveryDay: 'Tomorrow',
    isPremiumBrand: true,
    isDiscounted: true,
    originalPrice: 300,
  },
  {
    id: '2',
    name: 'Whole Wheat Bread',
    brand: 'GoodGrain',
    packSize: '1 loaf',
    unitPriceExVat: 120,
    unitPriceIncVat: 150,
    packPriceExVat: 120,
    packPriceIncVat: 150,
    unit: 'loaf',
    suppliers: ['Bónus', 'Krambúð'],
    stock: false,
    deliveryFee: 300,
    cutoffTime: '16:00',
    deliveryDay: 'In 2 days',
  },
  {
    id: '3',
    name: 'Free-Range Eggs',
    brand: 'HappyHen',
    packSize: '12 eggs',
    unitPriceExVat: 300,
    unitPriceIncVat: 370,
    packPriceExVat: 300,
    packPriceIncVat: 370,
    unit: 'pack',
    suppliers: ['Hagkaup', 'Fjarðarkaup'],
    stock: true,
    isPremiumBrand: true,
  },
  {
    id: '4',
    name: 'Cheddar Cheese',
    brand: 'DairyBest',
    packSize: '500g block',
    unitPriceExVat: 450,
    unitPriceIncVat: 560,
    packPriceExVat: 450,
    packPriceIncVat: 560,
    unit: 'block',
    suppliers: ['Krónan', 'Nettó'],
    stock: true,
    deliveryFee: 400,
    cutoffTime: '12:00',
    deliveryDay: 'Tomorrow',
  },
  {
    id: '5',
    name: 'Ground Coffee',
    brand: 'AromaCafe',
    packSize: '250g pack',
    unitPriceExVat: 380,
    unitPriceIncVat: 470,
    packPriceExVat: 380,
    packPriceIncVat: 470,
    unit: 'pack',
    suppliers: ['Metro', 'Costco'],
    stock: true,
    isDiscounted: true,
    originalPrice: 420,
  },
  {
    id: '6',
    name: 'Salmon Fillet',
    brand: 'OceanFresh',
    packSize: '200g',
    unitPriceExVat: 800,
    unitPriceIncVat: 990,
    packPriceExVat: 800,
    packPriceIncVat: 990,
    unit: 'fillet',
    suppliers: ['Hagkaup', 'Fjarðarkaup'],
    stock: false,
    deliveryFee: 600,
    cutoffTime: '18:00',
    deliveryDay: 'In 3 days',
    isPremiumBrand: true,
  },
  {
    id: '7',
    name: 'Pasta (Spaghetti)',
    brand: 'ItalyBest',
    packSize: '500g pack',
    unitPriceExVat: 180,
    unitPriceIncVat: 220,
    packPriceExVat: 180,
    packPriceIncVat: 220,
    unit: 'pack',
    suppliers: ['Bónus', 'Krónan'],
    stock: true,
  },
  {
    id: '8',
    name: 'Olive Oil',
    brand: 'MediterraneanGold',
    packSize: '500ml bottle',
    unitPriceExVat: 600,
    unitPriceIncVat: 740,
    packPriceExVat: 600,
    packPriceIncVat: 740,
    unit: 'bottle',
    suppliers: ['Nettó', 'Krambúð'],
    stock: true,
    deliveryFee: 350,
    cutoffTime: '10:00',
    deliveryDay: 'Today',
    isPremiumBrand: true,
  },
  {
    id: '9',
    name: 'Coca Cola',
    brand: 'Coca Cola',
    packSize: '6 pack',
    unitPriceExVat: 1000,
    unitPriceIncVat: 1240,
    packPriceExVat: 1000,
    packPriceIncVat: 1240,
    unit: 'pack',
    suppliers: ['Bónus', 'Krónan'],
    stock: true,
  },
  {
    id: '10',
    name: 'Ground Beef',
    brand: 'MeatHouse',
    packSize: '1kg',
    unitPriceExVat: 1200,
    unitPriceIncVat: 1488,
    packPriceExVat: 1200,
    packPriceIncVat: 1488,
    unit: 'kg',
    suppliers: ['Metro', 'Costco'],
    stock: true,
  },
]

function generateRandomPriceHistory(length: number, initialPrice: number, volatility: number) {
  let currentPrice = initialPrice
  const history = [currentPrice]

  for (let i = 1; i < length; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility
    currentPrice += change
    currentPrice = Math.max(10, currentPrice)
    history.push(currentPrice)
  }

  return history
}

const enhancedItems = MOCK_ITEMS.map(item => ({
  ...item,
  priceHistory: generateRandomPriceHistory(12, item.unitPriceExVat, item.unitPriceExVat * 0.05),
}))

const MOCK_COMPARISON_ITEMS = [
  {
    id: 'item-1',
    itemName: 'High-Quality Printing Paper',
    brand: 'OfficePlus',
    category: 'Office Supplies',
    image: 'https://picsum.photos/id/237/200/150',
    description: 'Premium paper for crisp, clear prints and professional documents.',
    specifications: {
      size: 'A4',
      weight: '80gsm',
      brightness: '96%',
    },
    prices: [
      {
        supplierId: 'supplier-101',
        supplierName: 'Metro',
        price: 5500,
        priceIncVat: 6820,
        unit: 'pack',
        packSize: '500 sheets',
        availability: 'in-stock',
        leadTime: '1-2 days',
        moq: 1,
        discount: 0.05,
        lastUpdated: '2024-08-01',
        priceHistory: generateRandomPriceHistory(12, 5500, 200),
        isPreferred: true,
      },
      {
        supplierId: 'supplier-102',
        supplierName: 'Costco',
        price: 5200,
        priceIncVat: 6448,
        unit: 'pack',
        packSize: '500 sheets',
        availability: 'low-stock',
        leadTime: '3-5 days',
        moq: 5,
        lastUpdated: '2024-07-28',
        priceHistory: generateRandomPriceHistory(12, 5200, 180),
        isPreferred: false,
      },
      {
        supplierId: 'supplier-103',
        supplierName: 'Bónus',
        price: 5800,
        priceIncVat: 7192,
        unit: 'pack',
        packSize: '500 sheets',
        availability: 'out-of-stock',
        leadTime: '7-10 days',
        moq: 10,
        lastUpdated: '2024-07-20',
        priceHistory: generateRandomPriceHistory(12, 5800, 220),
        isPreferred: false,
      },
    ],
    averageRating: 4.5,
    tags: ['paper', 'printing', 'office'],
  },
  {
    id: 'item-2',
    itemName: 'Ergonomic Office Chair',
    brand: 'ComfortZone',
    category: 'Furniture',
    image: 'https://picsum.photos/id/102/200/150',
    description: 'Adjustable chair designed for maximum comfort and support during long work hours.',
    specifications: {
      material: 'Mesh, Steel',
      adjustability: 'Height, Lumbar, Armrests',
      weightCapacity: '150kg',
    },
    prices: [
      {
        supplierId: 'supplier-201',
        supplierName: 'Hagkaup',
        price: 42000,
        priceIncVat: 52080,
        unit: 'unit',
        packSize: '1 chair',
        availability: 'in-stock',
        leadTime: '2-3 days',
        moq: 1,
        discount: 0.1,
        lastUpdated: '2024-08-05',
        priceHistory: generateRandomPriceHistory(12, 42000, 1500),
        isPreferred: true,
      },
      {
        supplierId: 'supplier-202',
        supplierName: 'Rúmfatalagerinn',
        price: 40000,
        priceIncVat: 49600,
        unit: 'unit',
        packSize: '1 chair',
        availability: 'in-stock',
        leadTime: '5-7 days',
        moq: 1,
        lastUpdated: '2024-08-01',
        priceHistory: generateRandomPriceHistory(12, 40000, 1400),
        isPreferred: false,
      },
      {
        supplierId: 'supplier-203',
        supplierName: 'IKEA',
        price: 38000,
        priceIncVat: 47120,
        unit: 'unit',
        packSize: '1 chair',
        availability: 'low-stock',
        leadTime: '10-14 days',
        moq: 1,
        lastUpdated: '2024-07-25',
        priceHistory: generateRandomPriceHistory(12, 38000, 1300),
        isPreferred: false,
      },
    ],
    averageRating: 4.8,
    tags: ['chair', 'ergonomic', 'furniture'],
  },
  {
    id: 'item-3',
    itemName: 'Wireless Mouse',
    brand: 'TechMaster',
    category: 'Electronics',
    image: 'https://picsum.photos/id/139/200/150',
    description: 'Comfortable and reliable wireless mouse for everyday use.',
    specifications: {
      connectivity: '2.4GHz Wireless',
      dpi: '1600',
      batteryLife: '12 months',
    },
    prices: [
      {
        supplierId: 'supplier-301',
        supplierName: 'Elko',
        price: 2500,
        priceIncVat: 3100,
        unit: 'unit',
        packSize: '1 mouse',
        availability: 'in-stock',
        leadTime: '1-2 days',
        moq: 1,
        discount: 0.0,
        lastUpdated: '2024-08-07',
        priceHistory: generateRandomPriceHistory(12, 2500, 100),
        isPreferred: true,
      },
      {
        supplierId: 'supplier-302',
        supplierName: ' কম্পিউটার দোকান',
        price: 2300,
        priceIncVat: 2852,
        unit: 'unit',
        packSize: '1 mouse',
        availability: 'in-stock',
        leadTime: '3-5 days',
        moq: 1,
        lastUpdated: '2024-08-03',
        priceHistory: generateRandomPriceHistory(12, 2300, 90),
        isPreferred: false,
      },
      {
        supplierId: 'supplier-303',
        supplierName: 'Tölvutek',
        price: 2700,
        priceIncVat: 3348,
        unit: 'unit',
        packSize: '1 mouse',
        availability: 'low-stock',
        leadTime: '5-7 days',
        moq: 1,
        lastUpdated: '2024-07-30',
        priceHistory: generateRandomPriceHistory(12, 2700, 110),
        isPreferred: false,
      },
    ],
    averageRating: 4.2,
    tags: ['mouse', 'wireless', 'electronics'],
  },
]

function IndexPageContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('quick-order')
  const [comparisonItems, setComparisonItems] = useState(MOCK_COMPARISON_ITEMS)
  const { items } = useCart()
  const { userMode } = useSettings()

  const handleAddToComparison = (item: Item) => {
    const newItem = {
      id: item.id,
      itemName: item.name,
      brand: item.brand,
      category: 'Various',
      image: 'https://picsum.photos/id/237/200/150',
      description: 'This is a test description',
      specifications: {
        size: 'A4',
        weight: '80gsm',
        brightness: '96%',
      },
      prices: [
        {
          supplierId: item.suppliers[0],
          supplierName: item.suppliers[0],
          price: item.unitPriceExVat,
          priceIncVat: item.unitPriceIncVat,
          unit: item.unit,
          packSize: item.packSize,
          availability: item.stock ? 'in-stock' : 'out-of-stock',
          leadTime: '1-2 days',
          moq: 1,
          discount: 0.05,
          lastUpdated: '2024-08-01',
          priceHistory: generateRandomPriceHistory(12, item.unitPriceExVat, item.unitPriceExVat * 0.05),
          isPreferred: true,
        }
      ],
      averageRating: 4.5,
      tags: ['test'],
    }
    setComparisonItems(prev => [...prev, newItem])
  }

  const handleAddToCart = (item: any, supplier: any, quantity: number) => {
    console.log('Adding to cart', item, supplier, quantity)
  }

  const handleRemoveItem = (itemId: string) => {
    setComparisonItems(prev => prev.filter(item => item.id !== itemId))
  }

  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase()
    return enhancedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.brand.toLowerCase().includes(lowerQuery)
    )
  }, [searchQuery])

  const handleAddSuggestedItem = (itemId: string) => {
    const item = filteredItems.find(i => i.id === itemId)
    if (item) {
      handleAddToComparison(item)
    }
  }

  return (
    <div className="container relative">
      {/* Hero Section */}
      <section className="relative py-12">
        <div className="absolute inset-0 bg-brand-100 rounded-xl blur-xl opacity-75 -z-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Streamline Your Procurement Process
            </h1>
            <p className="text-muted-foreground">
              Find the best prices, optimize your orders, and save time with our
              intelligent procurement platform.
            </p>
            <div className="flex gap-3">
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Start Searching
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/hero-image.svg"
              alt="Procurement Dashboard"
              className="max-w-md rounded-lg shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Smart Cart Integration */}
      <EnhancedCartIntegration />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-24">
        {/* Main Content Column */}
        <div className="md:col-span-3 space-y-6">
          {/* Search and Tabs */}
          <div className="space-y-3">
            <QuickSearch
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <Tabs
              defaultValue="quick-order"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="bg-muted/50 rounded-md p-1 shadow-sm w-full">
                <TabsTrigger value="quick-order" className="data-[state=active]:shadow-md">
                  <Grid className="w-4 h-4 mr-2" />
                  Quick Order
                </TabsTrigger>
                <TabsTrigger value="smart-list" className="data-[state=active]:shadow-md">
                  <List className="w-4 h-4 mr-2" />
                  Smart List
                </TabsTrigger>
                <TabsTrigger value="pantry-lanes" className="data-[state=active]:shadow-md">
                  <Package className="w-4 h-4 mr-2" />
                  Pantry Lanes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="quick-order" className="space-y-4">
                <DeliveryOptimizationBanner />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <PerformanceOptimizedList
                    items={filteredItems}
                    onCompareItem={(itemId) => {
                      const item = filteredItems.find(i => i.id === itemId)
                      if (item) handleAddToComparison(item)
                    }}
                    userMode={userMode}
                    renderItem={(item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onCompareItem={(itemId) => {
                          const foundItem = filteredItems.find(i => i.id === itemId)
                          if (foundItem) handleAddToComparison(foundItem)
                        }}
                        userMode={userMode}
                      />
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="smart-list" className="space-y-4">
                <SmartSuggestions onAddSuggestedItem={handleAddSuggestedItem} />
                <CompactOrderGuidesCTA />
              </TabsContent>
              <TabsContent value="pantry-lanes" className="space-y-4">
                <PantryLanes 
                  onLaneSelect={(laneId) => console.log('Lane selected:', laneId)}
                  selectedLane={null}
                  onAddToCart={(item) => console.log('Add to cart:', item)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="md:col-span-1">
          <SmartCartSidebar className="sticky top-4" />
        </div>
      </div>
    </div>
  )
}

export default function IndexPage() {
  return (
    <ErrorBoundary fallback={<QuickOrderErrorFallback />}>
      <IndexPageContent />
    </ErrorBoundary>
  )
}
