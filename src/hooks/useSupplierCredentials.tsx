
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import { Database } from '@/lib/types/database'

type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row'] & {
  supplier?: Database['public']['Tables']['suppliers']['Row']
}
type SupplierCredentialInsert = Database['public']['Tables']['supplier_credentials']['Insert']

export function useSupplierCredentials() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['supplier-credentials', profile?.tenant_id || 'solo'],
    queryFn: async (): Promise<SupplierCredential[]> => {
      const tenantId = profile?.tenant_id

      const query = supabase
        .from('supplier_credentials')
        .select(`
          *,
          supplier:suppliers(*)
        `)

      const { data, error } = tenantId
        ? await query.eq('tenant_id', tenantId)
        : await query.is('tenant_id', null)

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createCredential = useMutation({
    mutationFn: async (credential: Omit<SupplierCredentialInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const payload = { ...credential, tenant_id: profile?.tenant_id ?? null }

      const { data, error } = await supabase
        .from('supplier_credentials')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials saved',
        description: 'Supplier credentials have been securely stored'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateCredential = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierCredential> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials updated',
        description: 'Supplier credentials have been updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const deleteCredential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_credentials')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials deleted',
        description: 'Supplier credentials have been removed'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    credentials,
    isLoading,
    createCredential,
    updateCredential,
    deleteCredential
  }
}
