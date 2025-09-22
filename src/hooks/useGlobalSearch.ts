import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { handleQueryError } from '@/lib/queryErrorHandler'
import { formatCurrency } from '@/lib/format'
import type { AvailabilityStatus } from '@/services/catalog'

export type SearchScope = 'all' | 'products' | 'suppliers' | 'orders'

const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
  UNKNOWN: 'Check availability',
}

export interface SearchItemMetadata {
  subtitle?: string
  availability?: string
  availabilityStatus?: AvailabilityStatus | null
  price?: string
  priceValue?: number | null
  imageUrl?: string
  supplierIds?: string[]
  supplierNames?: string[]
  supplierCount?: number
  canonicalPack?: string
  packSizes?: string[]
}

export interface SearchItem {
  id: string
  name: string
  metadata?: SearchItemMetadata
}

export interface SearchSection {
  items: SearchItem[]
  totalCount: number
  hasMore: boolean
}

export interface SearchSections {
  products: SearchSection
  suppliers: SearchSection
  orders: SearchSection
}

export function useGlobalSearch(q: string, scope: SearchScope) {
  const [sections, setSections] = useState<SearchSections>({
    products: { items: [], totalCount: 0, hasMore: false },
    suppliers: { items: [], totalCount: 0, hasMore: false },
    orders: { items: [], totalCount: 0, hasMore: false }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setSections({ 
        products: { items: [], totalCount: 0, hasMore: false },
        suppliers: { items: [], totalCount: 0, hasMore: false },
        orders: { items: [], totalCount: 0, hasMore: false }
      })
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const searchData = async () => {
      try {
        const query = q.trim()
        const LIMIT = 8 // Increased from 5
        const results: SearchSections = {
          products: { items: [], totalCount: 0, hasMore: false },
          suppliers: { items: [], totalCount: 0, hasMore: false },
          orders: { items: [], totalCount: 0, hasMore: false }
        }

        // Search products from v_public_catalog
        if (scope === 'all' || scope === 'products') {
          // Get total count first
          const { count: totalCount } = await supabase
            .from('v_public_catalog')
            .select('catalog_id', { count: 'exact', head: true })
            .ilike('name', `%${query}%`)
            .not('catalog_id', 'is', null)

          // Get limited results with more data
          const { data: products, error: productsError } = await supabase
            .from('v_public_catalog')
            .select(
              'catalog_id, name, brand, availability_status, availability_text, best_price, sample_image_url, supplier_ids, supplier_names, suppliers_count, canonical_pack, pack_sizes'
            )
            .ilike('name', `%${query}%`)
            .not('catalog_id', 'is', null)
            .limit(LIMIT)

          if (productsError) {
            console.warn('Products search error:', productsError)
          } else if (products) {
            results.products = {
              items: products.map(p => {
                const availabilityStatus = (p.availability_status ?? null) as AvailabilityStatus | null
                const supplierIds = Array.isArray(p.supplier_ids)
                  ? (p.supplier_ids as string[]).filter(Boolean)
                  : []
                const supplierNames = Array.isArray(p.supplier_names)
                  ? (p.supplier_names as string[]).filter(Boolean)
                  : []
                const packSizes = Array.isArray(p.pack_sizes)
                  ? (p.pack_sizes as string[]).filter(Boolean)
                  : []
                const priceValue = typeof p.best_price === 'number' ? p.best_price : null

                return {
                  id: p.catalog_id!,
                  name: p.name!,
                  metadata: {
                    subtitle: p.brand || undefined,
                    availability:
                      p.availability_text ||
                      (availabilityStatus ? AVAILABILITY_LABELS[availabilityStatus] : undefined),
                    availabilityStatus,
                    price: priceValue != null ? formatCurrency(priceValue) : undefined,
                    priceValue,
                    imageUrl: p.sample_image_url || undefined,
                    supplierIds: supplierIds.length ? supplierIds : undefined,
                    supplierNames: supplierNames.length ? supplierNames : undefined,
                    supplierCount:
                      typeof p.suppliers_count === 'number'
                        ? p.suppliers_count
                        : supplierIds.length || undefined,
                    canonicalPack: p.canonical_pack || undefined,
                    packSizes: packSizes.length ? packSizes : undefined,
                  },
                }
              }),
              totalCount: totalCount || 0,
              hasMore: (totalCount || 0) > LIMIT
            }
          }
        }

        // Search suppliers
        if (scope === 'all' || scope === 'suppliers') {
          // Get total count
          const { count: totalCount } = await supabase
            .from('suppliers')
            .select('id', { count: 'exact', head: true })
            .ilike('name', `%${query}%`)

          const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .select('id, name, logo_url')
            .ilike('name', `%${query}%`)
            .limit(LIMIT)

          if (suppliersError) {
            console.warn('Suppliers search error:', suppliersError)
          } else if (suppliers) {
            results.suppliers = {
              items: suppliers.map(s => ({
                id: s.id,
                name: s.name,
                metadata: {
                  imageUrl: s.logo_url || undefined
                }
              })),
              totalCount: totalCount || 0,
              hasMore: (totalCount || 0) > LIMIT
            }
          }
        }

        // Orders - using audit events for now since no orders table exists
        if (scope === 'all' || scope === 'orders') {
          const { data: orderEvents, error: ordersError } = await supabase
            .from('audit_events')
            .select('id, action, meta_data, created_at')
            .in('action', ['order_created', 'order_placed', 'compose_order'])
            .order('created_at', { ascending: false })
            .limit(LIMIT * 2) // Get more to filter

          if (ordersError) {
            console.warn('Orders search error:', ordersError)
          } else if (orderEvents) {
            const filteredOrders = orderEvents
              .filter(event => {
                const orderName = event.meta_data?.order_number || event.meta_data?.order_id || `Order ${event.id.slice(0, 8)}`
                return orderName.toLowerCase().includes(query.toLowerCase())
              })
              .slice(0, LIMIT)

            results.orders = {
              items: filteredOrders.map(event => ({
                id: event.id,
                name: event.meta_data?.order_number || event.meta_data?.order_id || `Order ${event.id.slice(0, 8)}`,
                metadata: {
                  subtitle: new Date(event.created_at).toLocaleDateString()
                }
              })),
              totalCount: filteredOrders.length, // This is approximate since we filter after query
              hasMore: filteredOrders.length >= LIMIT
            }
          }
        }

        if (!controller.signal.aborted) {
          setSections(results)
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          const errorMessage = handleQueryError(e, 'global search')
          setError(new Error(errorMessage))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const timer = setTimeout(() => {
      searchData()
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [q, scope])

  return { sections, isLoading, error }
}

