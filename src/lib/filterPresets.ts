/**
 * Filter presets for common buyer workflows
 * Click a preset to quickly apply common filter combinations
 */

export interface FilterPreset {
  label: string
  icon?: string
  params: {
    in_stock?: boolean
    my_suppliers?: boolean
    special_only?: boolean
    has_price?: boolean
    sort?: string
  }
}

export const FILTER_PRESETS = {
  fastReorder: {
    label: 'Fast Re-order',
    icon: '⚡',
    params: {
      in_stock: true,
      my_suppliers: true,
      sort: 'recent',
    },
  },
  priceHunt: {
    label: 'Price Hunt',
    icon: '💰',
    params: {
      special_only: true,
      sort: 'price_asc',
    },
  },
  inStockOnly: {
    label: 'Available Now',
    icon: '✓',
    params: {
      in_stock: true,
      sort: 'relevance',
    },
  },
  mySuppliers: {
    label: 'My Suppliers',
    icon: '🤝',
    params: {
      my_suppliers: true,
      in_stock: true,
    },
  },
} as const

export type PresetKey = keyof typeof FILTER_PRESETS
