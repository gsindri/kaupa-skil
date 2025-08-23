import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const actorId = process.env.MERGE_USER_ID || null

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

function extractSize(name) {
  if (!name) return null
  const match = name.match(/\b\d+(?:[.,]\d+)?\s?(?:kg|g|l|ml)\b/i)
  return match ? match[0].toLowerCase() : null
}

async function findMatch(mock) {
  if (mock.ean) {
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .eq('ean', mock.ean)
      .neq('data_provenance', 'mock')
      .maybeSingle()
    if (error) throw error
    if (data) return data
  }

  if (mock.brand) {
    const size = extractSize(mock.name)
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .ilike('brand', mock.brand)
      .ilike('name', size ? `%${size}%` : mock.name)
      .neq('data_provenance', 'mock')
      .maybeSingle()
    if (error) throw error
    if (data) return data
  }

  return null
}

async function handleMockItem(mock) {
  const match = await findMatch(mock)

  if (match) {
    await supabase
      .from('item_matches')
      .update({ item_id: match.id })
      .eq('item_id', mock.id)

    await supabase.from('items').delete().eq('id', mock.id)

    await supabase.from('mock_item_audit').insert({
      mock_item_id: mock.id,
      action: 'merged',
      target_item_id: match.id,
      performed_by: actorId
    })

    console.log(`Merged mock item ${mock.id} into ${match.id}`)
  } else {
    await supabase.from('mock_item_audit').insert({
      mock_item_id: mock.id,
      action: 'needs_review',
      performed_by: actorId
    })
    console.log(`Flagged mock item ${mock.id} for review`)
  }
}

async function main() {
  const { data: mocks, error } = await supabase
    .from('items')
    .select('id, name, brand, ean')
    .eq('data_provenance', 'mock')

  if (error) throw error
  for (const mock of mocks) {
    await handleMockItem(mock)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
