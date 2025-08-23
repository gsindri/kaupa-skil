import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(url, key, { auth: { persistSession: false } })

async function run() {
  const orgId = randomUUID()
  const supplierId = randomUUID()

  await sb.from('tenants').upsert({ id: orgId, name: 'Test Org' }, { onConflict: 'id' })
  await sb.from('suppliers').upsert({ id: supplierId, name: 'Test Supplier' }, { onConflict: 'id' })

  const catalogIds: string[] = []
  for (let i = 0; i < 20; i++) {
    const name = i === 0 ? 'Milk 1L' : `Product ${i}`
    const { data } = await sb
      .from('catalog_product')
      .insert({ name, brand: 'Brand ' + i, size: '1L' })
      .select('catalog_id')
      .single()
    catalogIds.push(data!.catalog_id)
  }

  const supplierProductIds: string[] = []
  for (let i = 0; i < 50; i++) {
    const catalog_id = i < catalogIds.length ? catalogIds[i % catalogIds.length] : null
    const { data } = await sb
      .from('supplier_product')
      .insert({
        supplier_id: supplierId,
        supplier_sku: `SKU-${i}`,
        catalog_id,
        source_url: 'https://example.com',
        raw_hash: `${i}`,
        raw_payload_json: { idx: i }
      })
      .select('supplier_product_id, catalog_id')
      .single()
    supplierProductIds.push(data!.supplier_product_id)
    if (catalog_id && i < 5) {
      await sb.from('offer').insert({
        org_id: orgId,
        supplier_product_id: data!.supplier_product_id,
        price: 100 + i,
        currency: 'ISK'
      })
    }
  }

  console.log('Seeded catalog with org', orgId, 'and supplier', supplierId)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
