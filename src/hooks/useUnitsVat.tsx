
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { createIcelandUnitVatEngine, type Unit, type VatRule } from '@/lib/unitVat'

export function useUnitsVat() {
  return useQuery({
    queryKey: ['units-vat'],
    queryFn: async () => {
      const [unitsResponse, vatRulesResponse] = await Promise.all([
        (supabase as any).from('units').select('*'),
        (supabase as any).from('vat_rules').select('*')
      ])

      if (unitsResponse.error) {
        console.warn('Units table query failed:', unitsResponse.error)
      }
      if (vatRulesResponse.error) {
        console.warn('VAT rules table query failed:', vatRulesResponse.error)
      }

      const units = (unitsResponse.data as Unit[]) || []
      const vatRules = (vatRulesResponse.data as VatRule[]) || []

      const engine = createIcelandUnitVatEngine(units, vatRules)

      return {
        units,
        vatRules,
        engine
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once for missing tables
  })
}
