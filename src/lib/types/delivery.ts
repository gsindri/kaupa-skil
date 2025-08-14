
export interface DeliveryRule {
  id: string
  supplier_id: string
  zone: string
  free_threshold_ex_vat: number | null
  flat_fee: number
  fuel_surcharge_pct: number
  pallet_deposit_per_unit: number
  cutoff_time: string | null
  delivery_days: number[]
  tiers_json: DeliveryTier[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DeliveryTier {
  threshold: number
  fee: number
}

export interface Zone {
  id: string
  name: string
  country_code: string
  region: string | null
  postal_codes: string[]
  base_delivery_fee: number
  created_at: string
}

export interface DeliveryCalculation {
  supplier_id: string
  supplier_name: string
  subtotal_ex_vat: number
  delivery_fee: number
  fuel_surcharge: number
  pallet_deposit: number
  total_delivery_cost: number
  landed_cost: number
  is_under_threshold: boolean
  threshold_amount: number | null
  amount_to_free_delivery: number | null
  next_delivery_day: string | null
}

export interface OrderDeliveryOptimization {
  current_total: number
  optimized_total: number
  savings: number
  suggestions: DeliveryOptimizationSuggestion[]
  warnings: DeliveryWarning[]
}

export interface DeliveryOptimizationSuggestion {
  type: 'top_up' | 'consolidate' | 'hold_and_merge'
  supplier_id: string
  supplier_name: string
  description: string
  savings: number
  items?: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
}

export interface DeliveryWarning {
  type: 'new_supplier_fee' | 'inefficient_split' | 'under_moq'
  supplier_id: string
  supplier_name: string
  message: string
  cost_impact: number
}
