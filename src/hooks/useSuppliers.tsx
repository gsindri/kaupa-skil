
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

type Supplier = any
type SupplierInsert = any

export function useSuppliers() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    }
  })

  const createSupplier = useMutation({
    mutationFn: async (supplier: Omit<SupplierInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Supplier created',
        description: 'New supplier has been added'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create supplier',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Supplier updated',
        description: 'Supplier information has been updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update supplier',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    suppliers,
    isLoading,
    createSupplier,
    updateSupplier
  }
}
