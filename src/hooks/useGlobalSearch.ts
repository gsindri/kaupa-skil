import { useState, useEffect } from 'react'

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

const MOCK_DATA: SearchSections = {
  products: [
    { id: 'p1', name: 'Olive Oil' },
    { id: 'p2', name: 'Organic Tomatoes' },
    { id: 'p3', name: 'Sea Salt' },
    { id: 'p4', name: 'Whole Wheat Flour' },
    { id: 'p5', name: 'Dark Chocolate' }
  ],
  suppliers: [
    { id: 's1', name: 'Icelandic Goods Co' },
    { id: 's2', name: 'Nordic Foods' },
    { id: 's3', name: 'Harbor Wholesale' },
    { id: 's4', name: 'FreshFarm Suppliers' },
    { id: 's5', name: 'Arctic Imports' }
  ],
  orders: [
    { id: 'o1', name: 'Order #1001' },
    { id: 'o2', name: 'Order #1002' },
    { id: 'o3', name: 'Order #1003' },
    { id: 'o4', name: 'Order #1004' },
    { id: 'o5', name: 'Order #1005' }
  ]
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
    if (!q) {
      setSections({ products: [], suppliers: [], orders: [] })
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    const timer = setTimeout(() => {
      try {
        const query = q.toLowerCase()
        const filter = (items: SearchItem[]) =>
          items.filter((i) => i.name.toLowerCase().includes(query)).slice(0, 5)

        const next: SearchSections = {
          products: scope !== 'suppliers' && scope !== 'orders' ? filter(MOCK_DATA.products) : [],
          suppliers: scope !== 'products' && scope !== 'orders' ? filter(MOCK_DATA.suppliers) : [],
          orders: scope !== 'products' && scope !== 'suppliers' ? filter(MOCK_DATA.orders) : []
        }

        if (!controller.signal.aborted) {
          setSections(next)
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e as Error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [q, scope])

  return { sections, isLoading, error }
}

