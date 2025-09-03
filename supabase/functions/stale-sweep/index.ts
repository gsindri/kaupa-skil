import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for custom parameters (optional)
    const { days = 45 } = req.method === 'POST' ? await req.json().catch(() => ({})) : {}

    console.log(`Starting staleness sweep for items not seen in ${days} days`)

    // Call the mark_stale_supplier_products function
    const { data, error } = await supabase.rpc('mark_stale_supplier_products', { 
      _days: days 
    })

    if (error) {
      console.error('Error marking stale products:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to mark stale products', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful sweep
    console.log('Staleness sweep completed successfully')

    // Get count of stale products for reporting
    const { data: staleCount, error: countError } = await supabase
      .from('supplier_product')
      .select('id', { count: 'exact', head: true })
      .eq('active_status', 'STALE')

    const staleProductsCount = staleCount ? staleCount.length : 0

    return new Response(
      JSON.stringify({
        success: true,
        message: `Staleness sweep completed. ${staleProductsCount} products are now marked as stale.`,
        staleProductsCount,
        daysThreshold: days,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in stale-sweep:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})