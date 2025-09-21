import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { handleQueryError } from '@/lib/queryErrorHandler'

export type SearchScope = 'all' | 'products' | 'suppliers' | 'orders'

interface SearchItem {
  id: string
  name: string
}

interface SearchSections {
  products: SearchItem[]
  suppliers: SearchItem[]
  orders: SearchItem[]
}

export function useGlobalSearch(q: string, scope: SearchScope) {
  const [sections, setSections] = useState<SearchSections>({
    products: [],
    suppliers: [],
    orders: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setSections({ products: [], suppliers: [], orders: [] })
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const searchData = async () => {
      try {
        const query = q.trim()
        const results: SearchSections = {
          products: [],
          suppliers: [],
          orders: []
        }

        // Search products from v_public_catalog
        if (scope === 'all' || scope === 'products') {
          const { data: products, error: productsError } = await supabase
            .from('v_public_catalog')
            .select('catalog_id, name')
            .ilike('name', `%${query}%`)
            .not('catalog_id', 'is', null)
            .limit(5)

          if (productsError) {
            console.warn('Products search error:', productsError)
          } else if (products) {
            results.products = products.map(p => ({
              id: p.catalog_id!,
              name: p.name!
            }))
          }
        }

        // Search suppliers
        if (scope === 'all' || scope === 'suppliers') {
          const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .select('id, name')
            .ilike('name', `%${query}%`)
            .limit(5)

          if (suppliersError) {
            console.warn('Suppliers search error:', suppliersError)
          } else if (suppliers) {
            results.suppliers = suppliers.map(s => ({
              id: s.id,
              name: s.name
            }))
          }
        }

        // Orders - using audit events for now since no orders table exists
        if (scope === 'all' || scope === 'orders') {
          const { data: orderEvents, error: ordersError } = await supabase
            .from('audit_events')
            .select('id, action, meta_data')
            .in('action', ['order_created', 'order_placed', 'compose_order'])
            .order('created_at', { ascending: false })
            .limit(5)

          if (ordersError) {
            console.warn('Orders search error:', ordersError)
          } else if (orderEvents) {
            results.orders = orderEvents
              .filter(event => {
                const orderName = event.meta_data?.order_number || event.meta_data?.order_id || `Order ${event.id.slice(0, 8)}`
                return orderName.toLowerCase().includes(query.toLowerCase())
              })
              .map(event => ({
                id: event.id,
                name: event.meta_data?.order_number || event.meta_data?.order_id || `Order ${event.id.slice(0, 8)}`
              }))
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

