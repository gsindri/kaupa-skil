
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditSearchRequest {
  filters?: {
    action?: string
    entity_type?: string
    tenant_id?: string
    start_date?: string
    end_date?: string
    actor_id?: string
  }
  limit?: number
  offset?: number
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
      const { filters = {}, limit = 100, offset = 0 }: AuditSearchRequest = await req.json()

      console.log(`Searching audit logs for user ${user.id} with filters:`, filters)

      // Build the query
      let query = supabase
        .from('audit_events')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }

      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id)
      }

      if (filters.actor_id) {
        query = query.eq('actor_id', filters.actor_id)
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      const { data: auditEvents, error } = await query

      if (error) {
        console.error('Error searching audit events:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Found ${auditEvents.length} audit events`)

      return new Response(
        JSON.stringify({ 
          success: true,
          data: auditEvents,
          total: auditEvents.length,
          filters: filters
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
