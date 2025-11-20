import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
  supplierItemId: string
  supplierId: string
  supplierName: string
  itemName: string
  quantity: number
  packPrice: number | null
  packSize: string
  unit: string
  vatRate: number
}

interface MergeCartRequest {
  anonymousCartId: string
  items: CartItem[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get user profile to get tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      throw new Error('User profile not found or missing tenant_id')
    }

    const { items }: MergeCartRequest = await req.json()

    console.log(`Merging ${items.length} anonymous cart items for user ${user.id}`)

    // Group items by supplier
    const itemsBySupplier = items.reduce((acc, item) => {
      if (!acc[item.supplierId]) {
        acc[item.supplierId] = []
      }
      acc[item.supplierId].push(item)
      return acc
    }, {} as Record<string, CartItem[]>)

    const results = []

    // For each supplier, create or update a draft order
    for (const [supplierId, supplierItems] of Object.entries(itemsBySupplier)) {
      // Check if there's already a draft order for this supplier
      const { data: existingOrders, error: orderFetchError } = await supabase
        .from('orders')
        .select('id, order_lines(id, supplier_product_id, quantity_packs)')
        .eq('tenant_id', profile.tenant_id)
        .eq('supplier_id', supplierId)
        .eq('status', 'draft')
        .limit(1)

      if (orderFetchError) {
        console.error('Error fetching existing orders:', orderFetchError)
        throw orderFetchError
      }

      let orderId: string

      if (existingOrders && existingOrders.length > 0) {
        // Use existing draft order
        orderId = existingOrders[0].id
        console.log(`Using existing draft order ${orderId} for supplier ${supplierId}`)
      } else {
        // Create new draft order
        const { data: newOrder, error: orderCreateError } = await supabase
          .from('orders')
          .insert({
            tenant_id: profile.tenant_id,
            supplier_id: supplierId,
            status: 'draft',
            order_date: new Date().toISOString(),
            currency: 'ISK',
            vat_included: true,
            created_by: user.id,
          })
          .select('id')
          .single()

        if (orderCreateError || !newOrder) {
          console.error('Error creating order:', orderCreateError)
          throw orderCreateError
        }

        orderId = newOrder.id
        console.log(`Created new draft order ${orderId} for supplier ${supplierId}`)
      }

      // Get existing order lines to check for duplicates
      const existingLines = existingOrders?.[0]?.order_lines || []
      const existingLineMap = new Map(
        existingLines.map((line: any) => [line.supplier_product_id, line])
      )

      // Insert or update order lines
      const skippedItems: string[] = []
      const processedItems: string[] = []

      for (const item of supplierItems) {
        // Validate that supplier_product exists
        const { data: supplierProduct, error: productError } = await supabase
          .from('supplier_product')
          .select('id')
          .eq('id', item.supplierItemId)
          .single()

        if (productError || !supplierProduct) {
          console.warn(`Skipping invalid product ${item.supplierItemId}: product not found`)
          skippedItems.push(item.supplierItemId)
          continue
        }

        const existingLine = existingLineMap.get(item.supplierItemId)

        if (existingLine) {
          // Update quantity
          const newQuantity = existingLine.quantity_packs + item.quantity

          const { error: updateError } = await supabase
            .from('order_lines')
            .update({
              quantity_packs: newQuantity,
              line_total: (item.packPrice || 0) * newQuantity,
            })
            .eq('id', existingLine.id)

          if (updateError) {
            console.error('Error updating order line:', updateError)
            skippedItems.push(item.supplierItemId)
            continue
          }

          console.log(`Updated order line ${existingLine.id} with new quantity ${newQuantity}`)
          processedItems.push(item.supplierItemId)
        } else {
          // Insert new order line
          const { error: lineError } = await supabase.from('order_lines').insert({
            order_id: orderId,
            supplier_product_id: item.supplierItemId,
            quantity_packs: item.quantity,
            unit_price_per_pack: item.packPrice || 0,
            line_total: (item.packPrice || 0) * item.quantity,
            pack_size: item.packSize,
            currency: 'ISK',
            vat_included: true,
          })

          if (lineError) {
            console.error('Error creating order line:', lineError)
            skippedItems.push(item.supplierItemId)
            continue
          }

          console.log(`Created order line for item ${item.supplierItemId}`)
          processedItems.push(item.supplierItemId)
        }
      }

      results.push({
        supplierId,
        orderId,
        itemsCount: supplierItems.length,
        processedCount: processedItems.length,
        skippedCount: skippedItems.length,
        skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
      })
    }

    console.log(`Successfully merged cart for user ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Merged ${items.length} items into ${results.length} orders`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error merging cart:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
