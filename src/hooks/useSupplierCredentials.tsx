import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import type { Database } from '@/lib/types'

type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row']

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
        .select('*')

      const { data, error } = tenantId
        ? await query.eq('tenant_id', tenantId)
        : await query.is('tenant_id', null)

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createCredential = useMutation({
    mutationFn: async (credentialData: { 
      supplier_id: string; 
      username?: string; 
      password?: string; 
      api_key?: string 
    }) => {
      const { supplier_id, ...credentials } = credentialData
      
      // Use proper encryption via database function
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_credential_data', {
          credential_data: credentials
        })

      if (encryptError) throw encryptError
      
      const payload = { 
        supplier_id,
        encrypted_credentials: encryptedData,
        tenant_id: profile?.tenant_id ?? null,
        test_status: 'pending'
      }

      const { data, error } = await supabase
        .from('supplier_credentials')
        .insert(payload)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials saved',
        description: 'Supplier credentials have been encrypted and stored securely using AES encryption'
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
        description: 'Supplier credentials have been securely removed'
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