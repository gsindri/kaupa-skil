import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateRequest {
  orderId: string
  maxDriftPercent?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orderId, maxDriftPercent = 5.0 }: ValidateRequest = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Validating prices for order ${orderId} with max drift ${maxDriftPercent}%`)

    // Call the validation function
    const { data, error } = await supabase.rpc('checkout_validate_prices', {
      order_id_param: orderId,
      max_drift_percent: maxDriftPercent,
    })

    if (error) {
      console.error('Validation error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = data[0]

    console.log('Validation result:', {
      hasDrift: result.has_drift,
      itemsWithDrift: result.drift_items?.length || 0,
      totalChange: result.total_new - result.total_old,
    })

    if (result.has_drift) {
      return new Response(
        JSON.stringify({
          success: false,
          hasDrift: true,
          driftItems: result.drift_items,
          totalOld: result.total_old,
          totalNew: result.total_new,
          message: `Prices have changed significantly. Please review your cart before proceeding.`,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasDrift: false,
        totalOld: result.total_old,
        totalNew: result.total_new,
        message: 'Prices validated successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Checkout validation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
