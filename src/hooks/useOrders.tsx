
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import type { Database } from '@/lib/types'

type Order = Database['public']['Tables']['orders']['Row'] & { tenant_id: string | null }
type OrderInsert = Database['public']['Tables']['orders']['Insert'] & {
  tenant_id?: string | null
}
type OrderLine = Database['public']['Tables']['order_lines']['Row']
type OrderLineInsert = Database['public']['Tables']['order_lines']['Insert']

export function useOrders() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', profile?.tenant_id ?? 'no-tenant'],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          created_by_profile:profiles(full_name, email),
          order_lines(*)
        `)
        .order('created_at', { ascending: false })

      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createOrder = useMutation({
    mutationFn: async (
      order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>
    ) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({ ...order, tenant_id: profile?.tenant_id ?? null })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Order created',
        description: 'New order has been created successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create order',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Order> & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ ...updates, tenant_id: profile?.tenant_id ?? null })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Order updated',
        description: 'Order has been updated successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update order',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const addOrderLine = useMutation({
    mutationFn: async (orderLine: Omit<OrderLineInsert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('order_lines')
        .insert(orderLine)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add order line',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const removeOrderLine = useMutation({
    mutationFn: async (orderLineId: string) => {
      const { error } = await supabase
        .from('order_lines')
        .delete()
        .eq('id', orderLineId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove order line',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    orders,
    isLoading,
    createOrder,
    updateOrder,
    addOrderLine,
    removeOrderLine
  }
}
