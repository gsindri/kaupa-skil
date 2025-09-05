import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function seed() {
  const { data: supplier, error: supplierErr } = await supabase
    .from('suppliers')
    .insert({ name: 'Demo Supplier', logo_url: '/placeholder.svg' })
    .select('id')
    .single()
  if (supplierErr) throw supplierErr
  const supplierId = supplier.id

  const { data: catalog, error: catErr } = await supabase
    .from('catalog_product')
    .insert({ name: 'Sample Product', brand: 'Acme', size: '1kg' })
    .select('catalog_id')
    .single()
  if (catErr) throw catErr
  const catalogId = catalog.catalog_id

  const { data: sp, error: spErr } = await supabase
    .from('supplier_product')
    .insert({
      supplier_id: supplierId,
      catalog_id: catalogId,
      supplier_sku: 'DEMO-1',
      pack_size: '1x1kg'
    })
    .select('supplier_product_id')
    .single()
  if (spErr) throw spErr
  const spId = sp.supplier_product_id

  const { data: org } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .maybeSingle()
  let orgId = org?.id
  if (!orgId) {
    const { data: newOrg, error: orgErr } = await supabase
      .from('tenants')
      .insert({ name: 'Demo Org' })
      .select('id')
      .single()
    if (orgErr) throw orgErr
    orgId = newOrg.id
  }

  const { error: offerErr } = await supabase
    .from('offer')
    .insert({
      org_id: orgId,
      supplier_product_id: spId,
      price: 9.99,
      currency: 'USD'
    })
  if (offerErr) throw offerErr

  console.log('Seeded sample catalog data')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
