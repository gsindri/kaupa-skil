import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BenchmarkRequest {
  supplier_id: string
  catalog_product_id: string
  month?: string // ISO date (YYYY-MM-DD), defaults to current month
}

interface BenchmarkResponse {
  is_displayable: boolean
  avg_kr_per_unit: number | null
  median_kr_per_unit: number | null
  p25_kr_per_unit: number | null
  p75_kr_per_unit: number | null
  orders_count: number | null
  distinct_orgs: number | null
  benchmark_month: string
  my_last_kr_per_unit: number | null
  my_last_order_date: string | null
  pct_vs_avg: number | null
  reason_not_displayable?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's tenant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      console.error('Profile error:', profileError)
      return new Response(JSON.stringify({ error: 'No tenant found for user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const { supplier_id, catalog_product_id, month }: BenchmarkRequest = await req.json()

    if (!supplier_id || !catalog_product_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default to current month if not specified
    const targetMonth = month 
      ? new Date(month).toISOString().slice(0, 10)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

    console.log('Fetching benchmark for:', { supplier_id, catalog_product_id, targetMonth, tenant_id: profile.tenant_id })

    // Fetch benchmark data
    const { data: benchmark, error: benchmarkError } = await supabase
      .from('price_benchmarks')
      .select('*')
      .eq('supplier_id', supplier_id)
      .eq('catalog_product_id', catalog_product_id)
      .eq('benchmark_month', targetMonth)
      .maybeSingle()

    if (benchmarkError) {
      console.error('Benchmark fetch error:', benchmarkError)
    }

    // Fetch my org's most recent price for this product
    const { data: myOrders, error: myOrdersError } = await supabase
      .from('order_lines')
      .select(`
        kr_per_base_unit,
        orders!inner(order_date, tenant_id, supplier_id)
      `)
      .eq('catalog_product_id', catalog_product_id)
      .eq('orders.tenant_id', profile.tenant_id)
      .eq('orders.supplier_id', supplier_id)
      .not('kr_per_base_unit', 'is', null)
      .order('orders(order_date)', { ascending: false })
      .limit(1)

    if (myOrdersError) {
      console.error('My orders fetch error:', myOrdersError)
    }

    const myLastPrice = myOrders?.[0]?.kr_per_base_unit || null
    const myLastOrderDate = myOrders?.[0]?.orders?.order_date || null

    // Build response
    const response: BenchmarkResponse = {
      is_displayable: benchmark?.is_displayable ?? false,
      avg_kr_per_unit: benchmark?.avg_kr_per_unit ?? null,
      median_kr_per_unit: benchmark?.median_kr_per_unit ?? null,
      p25_kr_per_unit: benchmark?.p25_kr_per_unit ?? null,
      p75_kr_per_unit: benchmark?.p75_kr_per_unit ?? null,
      orders_count: benchmark?.orders_count ?? null,
      distinct_orgs: benchmark?.distinct_orgs_count ?? null,
      benchmark_month: targetMonth,
      my_last_kr_per_unit: myLastPrice,
      my_last_order_date: myLastOrderDate,
      pct_vs_avg: myLastPrice && benchmark?.avg_kr_per_unit
        ? ((myLastPrice - benchmark.avg_kr_per_unit) / benchmark.avg_kr_per_unit) * 100
        : null
    }

    // Add reason if not displayable
    if (!benchmark) {
      response.reason_not_displayable = 'No benchmark data for this month'
    } else if (!benchmark.is_displayable) {
      const settings = benchmark.settings_snapshot as any
      const minOrgs = settings?.min_orgs || 3
      const minOrders = settings?.min_orders || 10
      response.reason_not_displayable = `Insufficient data (requires ≥${minOrgs} orgs and ≥${minOrders} orders)`
    }

    // Check if supplier has opted out
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('allow_price_aggregation')
      .eq('id', supplier_id)
      .single()

    if (supplier && !supplier.allow_price_aggregation) {
      response.is_displayable = false
      response.reason_not_displayable = 'Supplier has opted out of price benchmarking'
    }

    // Log access for audit
    await supabase.from('audit_events').insert({
      actor_id: user.id,
      tenant_id: profile.tenant_id,
      action: 'benchmark_accessed',
      entity_type: 'price_benchmark',
      entity_id: benchmark?.id,
      meta_data: {
        supplier_id,
        catalog_product_id,
        month: targetMonth,
        is_displayable: response.is_displayable
      }
    })

    console.log('Benchmark response:', response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Benchmark error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
