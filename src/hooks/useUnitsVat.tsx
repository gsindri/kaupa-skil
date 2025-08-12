
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { createIcelandUnitVatEngine } from '@/lib/unitVat'
import { Database } from '@/lib/types/database'

type Unit = Database['public']['Tables']['units']['Row']
type VatRule = Database['public']['Tables']['vat_rules']['Row']

export function useUnitsVat() {
  return useQuery({
    queryKey: ['units-vat'],
    queryFn: async () => {
      const [unitsResponse, vatRulesResponse] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('vat_rules').select('*')
      ])

      if (unitsResponse.error) throw unitsResponse.error
      if (vatRulesResponse.error) throw vatRulesResponse.error

      const units = unitsResponse.data as Unit[]
      const vatRules = vatRulesResponse.data as VatRule[]

      const engine = createIcelandUnitVatEngine(units, vatRules)

      return {
        units,
        vatRules,
        engine
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
