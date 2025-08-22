import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

interface PriceHistoryData {
  date: string
  [supplierName: string]: number | string
}

export default function PriceHistory() {
  const [selectedItem, setSelectedItem] = useState<string>('')
  const { profile } = useAuth()

  const { data: items } = useQuery({
    queryKey: ['items-with-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          brand,
          supplier_items!inner(
            price_quotes(pack_price, observed_at)
          )
        `)
        .limit(20)

      if (error) throw error
      return data.filter(item => item.supplier_items.some(si => si.price_quotes.length > 0))
    }
  })

  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', selectedItem],
    queryFn: async () => {
      if (!selectedItem) return []

      const { data, error } = await supabase
        .from('price_quotes')
        .select(`
          pack_price,
          unit_price_ex_vat,
          observed_at,
          supplier_items!inner(
            suppliers!inner(name)
          )
        `)
        .eq('supplier_items.item_id', selectedItem)
        .order('observed_at', { ascending: true })

      if (error) throw error

      // Group by date and supplier
      const groupedData: { [date: string]: { [supplier: string]: number } } = {}
      
      data.forEach(quote => {
        const date = new Date(quote.observed_at).toLocaleDateString('is-IS')
        // Since supplier_items is an array due to the join, we need to access the first element
        const supplierItem = Array.isArray(quote.supplier_items) ? quote.supplier_items[0] : quote.supplier_items
        const supplier = Array.isArray(supplierItem?.suppliers) ? supplierItem.suppliers[0] : supplierItem?.suppliers
        const supplierName = supplier?.name || 'Unknown'
        
        if (!groupedData[date]) {
          groupedData[date] = {}
        }
        
        groupedData[date][supplierName] = quote.unit_price_ex_vat || 0
      })

      // Convert to chart format
      const chartData: PriceHistoryData[] = Object.entries(groupedData).map(([date, suppliers]) => ({
        date,
        ...suppliers
      }))

      return chartData
    },
    enabled: !!selectedItem
  })

  const suppliers = React.useMemo(() => {
    if (!priceHistory?.length) return []
    
    const supplierSet = new Set<string>()
    priceHistory.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          supplierSet.add(key)
        }
      })
    })
    
    return Array.from(supplierSet)
  }, [priceHistory])

  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    suppliers.forEach((supplier, index) => {
      config[supplier] = {
        label: supplier,
        color: `hsl(var(--chart-${(index % 5) + 1}))`
      }
    })
    return config
  }, [suppliers])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Price History</h1>
        <p className="text-muted-foreground">
          Track price trends across suppliers over time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a product to view price history..." />
            </SelectTrigger>
            <SelectContent>
              {items?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} {item.brand && `- ${item.brand}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Price Trend (Ex VAT per Unit)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : priceHistory && priceHistory.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value.toLocaleString()} kr`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {suppliers.map((supplier, index) => (
                      <Line
                        key={supplier}
                        type="monotone"
                        dataKey={supplier}
                        stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No price history data available for this product.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
