
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from './use-toast'
import { Database } from '@/lib/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderLine = Database['public']['Tables']['order_lines']['Row']
type OrderLineInsert = Database['public']['Tables']['order_lines']['Insert']

export function useOrders() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', profile?.tenant_id],
    queryFn: async (): Promise<Order[]> => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          created_by_profile:profiles(full_name, email),
          order_lines(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.tenant_id
  })

  const createOrder = useMutation({
    mutationFn: async (order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
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
        .update(updates)
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
