import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SupplierSchedule {
  id: string
  tenant_id: string | null
  ingestion_cadence_minutes: number
  last_ingested_at: string | null
  backoff_until: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, tenant_id, ingestion_cadence_minutes, last_ingested_at, backoff_until')

    if (error) throw error

    const now = new Date()
    for (const s of (suppliers as SupplierSchedule[])) {
      if (s.backoff_until && new Date(s.backoff_until) > now) continue
      const last = s.last_ingested_at ? new Date(s.last_ingested_at) : null
      const due = !last || now.getTime() - last.getTime() >= s.ingestion_cadence_minutes * 60000
      if (!due) continue

      await supabase.from('jobs').insert({
        type: 'ingestion_run',
        status: 'pending',
        tenant_id: s.tenant_id,
        data: { supplier_id: s.id },
      })
    }

    return new Response(JSON.stringify({ scheduled: suppliers?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
