
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSessionRequest {
  tenant_id: string
  reason: string
  duration_minutes?: number
}

interface RevokeSessionRequest {
  session_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set the auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { tenant_id, reason, duration_minutes = 60 }: CreateSessionRequest = await req.json()

      if (!tenant_id || !reason?.trim()) {
        return new Response(
          JSON.stringify({ error: 'tenant_id and reason are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Creating support session for tenant ${tenant_id} by user ${user.id}`)

      // Use the RPC function to create support session
      const { data, error } = await supabase.rpc('create_support_session', {
        target_tenant_id: tenant_id,
        reason_text: reason.trim(),
        duration_minutes: duration_minutes
      })

      if (error) {
        console.error('Error creating support session:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Support session created with ID: ${data}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          session_id: data,
          message: 'Support session created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE') {
      const { session_id }: RevokeSessionRequest = await req.json()

      if (!session_id) {
        return new Response(
          JSON.stringify({ error: 'session_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Revoking support session ${session_id} by user ${user.id}`)

      // Revoke the support session
      const { error } = await supabase
        .from('support_sessions')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user.id
        })
        .eq('id', session_id)
        .or(`actor_id.eq.${user.id},tenant_id.in.(select tenant_id from memberships where user_id=${user.id})`)

      if (error) {
        console.error('Error revoking support session:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Support session ${session_id} revoked successfully`)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Support session revoked successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
