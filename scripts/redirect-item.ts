import { createClient } from '@supabase/supabase-js'

const [fromItemId, toItemId, tenantId] = process.argv.slice(2)
if (!fromItemId || !toItemId) {
  console.error('Usage: ts-node scripts/redirect-item.ts <fromItemId> <toItemId> [tenantId]')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

async function run() {
  await supabase.from('item_redirects').upsert({
    from_item_id: fromItemId,
    to_item_id: toItemId,
    created_by: null,
  })

  await supabase.rpc('log_audit_event', {
    action_name: 'redirect_item',
    entity_type_name: 'item',
    entity_id_val: fromItemId,
    reason_text: 'manual redirect',
    meta_data_val: { to_item_id: toItemId },
    tenant_id_val: tenantId ?? null,
  })

  console.log(`Redirected item ${fromItemId} to ${toItemId}`)
}

run()
