
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessJobRequest {
  job_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { job_id }: ProcessJobRequest = await req.json()

      if (!job_id) {
        return new Response(
          JSON.stringify({ error: 'job_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Processing job ${job_id}`)

      // Get the job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .eq('status', 'pending')
        .single()

      if (jobError || !job) {
        console.error('Job not found or not pending:', jobError)
        return new Response(
          JSON.stringify({ error: 'Job not found or not pending' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark job as running
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job_id)

      if (updateError) {
        console.error('Error updating job status:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update job status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log job start
      await supabase
        .from('job_logs')
        .insert({
          job_id: job_id,
          level: 'info',
          message: `Job started processing: ${job.type}`,
          data: { started_at: new Date().toISOString() }
        })

      try {
        // Process the job based on type
        let result = {}
        
        switch (job.type) {
          case 'ingestion_run':
            result = await processIngestionJob(job, supabase)
            break
          case 'test_connector':
            result = await processTestConnectorJob(job, supabase)
            break
          case 'admin_action':
            result = await processAdminActionJob(job, supabase)
            break
          default:
            throw new Error(`Unknown job type: ${job.type}`)
        }

        // Mark job as completed
        await supabase
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: result
          })
          .eq('id', job_id)

        await supabase
          .from('job_logs')
          .insert({
            job_id: job_id,
            level: 'info',
            message: 'Job completed successfully',
            data: { result, completed_at: new Date().toISOString() }
          })

        console.log(`Job ${job_id} completed successfully`)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Job processed successfully',
            result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (processingError) {
        console.error(`Error processing job ${job_id}:`, processingError)

        // Mark job as failed
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: processingError.message,
            retry_count: (job.retry_count || 0) + 1
          })
          .eq('id', job_id)

        await supabase
          .from('job_logs')
          .insert({
            job_id: job_id,
            level: 'error',
            message: `Job failed: ${processingError.message}`,
            data: { error: processingError.message, failed_at: new Date().toISOString() }
          })

        return new Response(
          JSON.stringify({ 
            success: false,
            error: processingError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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

async function processIngestionJob(job: any, supabase: any) {
  console.log('Processing ingestion job:', job.data)
  
  // Log the ingestion attempt
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: 'Starting price ingestion',
      data: { supplier_id: job.data.supplier_id, tenant_id: job.tenant_id }
    })

  // Simulate ingestion process
  // In a real implementation, this would:
  // 1. Fetch supplier credentials (encrypted)
  // 2. Connect to supplier API
  // 3. Fetch latest prices
  // 4. Update price_quotes table
  // 5. Log success/failure
  
  await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate work
  
  return {
    items_processed: 150,
    prices_updated: 145,
    errors: 5,
    duration_ms: 2000
  }
}

async function processTestConnectorJob(job: any, supabase: any) {
  console.log('Processing test connector job:', job.data)
  
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: 'Testing supplier connection',
      data: { supplier_id: job.data.supplier_id, tenant_id: job.tenant_id }
    })

  // Simulate connection test
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    connection_successful: true,
    response_time_ms: 250,
    api_version: '2.1',
    last_tested: new Date().toISOString()
  }
}

async function processAdminActionJob(job: any, supabase: any) {
  console.log('Processing admin action job:', job.data)
  
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: `Executing admin action: ${job.data.action}`,
      data: { action: job.data.action, tenant_id: job.tenant_id }
    })

  // Process different types of admin actions
  switch (job.data.action) {
    case 'delete_tenant':
      // Would implement safe tenant deletion
      break
    case 'rotate_keys':
      // Would implement key rotation
      break
    case 'update_vat_rules':
      // Would implement VAT rule updates
      break
    default:
      throw new Error(`Unknown admin action: ${job.data.action}`)
  }

  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    action_completed: true,
    timestamp: new Date().toISOString()
  }
}
