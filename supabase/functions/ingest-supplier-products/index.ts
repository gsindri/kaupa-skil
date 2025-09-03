import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ApiConfig {
  baseUrl: string
  auth: { type: 'oauth2' | 'key'; clientId?: string; clientSecret?: string; tokenUrl?: string; apiKey?: string }
  pageParam?: string
  pageSize?: number
}

interface CsvConfig {
  url: string
  headers: Record<string, string>
  unitMap?: Record<string, number>
}

interface ScrapeConfig {
  url: string
  respectRobots?: boolean
}

interface IngestionRequest {
  supplier_id: string
  source: 'api' | 'csv' | 'excel' | 'web'
  apiConfig?: ApiConfig
  csvConfig?: CsvConfig
  scrapeConfig?: ScrapeConfig
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { supplier_id, source, apiConfig, csvConfig, scrapeConfig }: IngestionRequest = await req.json()

    if (!supplier_id || !source) {
      return new Response('Missing parameters', { status: 400, headers: corsHeaders })
    }

    let records: any[] = []
    switch (source) {
      case 'api':
        if (!apiConfig) throw new Error('apiConfig required for API source')
        records = await fetchFromApi(apiConfig)
        break
      case 'csv':
      case 'excel':
        if (!csvConfig) throw new Error('csvConfig required for CSV/Excel source')
        records = await parseCsvOrExcel(csvConfig)
        break
      case 'web':
        if (!scrapeConfig) throw new Error('scrapeConfig required for web source')
        records = await scrapeWebsite(scrapeConfig)
        break
      default:
        throw new Error('Unknown source type')
    }

    for (const rec of records) {
      const normalized = normalizeRecord(rec, csvConfig?.headers)
      await upsertSupplierProduct(supabase, supplier_id, normalized.supplier_sku, normalized, rec)
    }

    return new Response(JSON.stringify({ processed: records.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function fetchFromApi(config: ApiConfig): Promise<any[]> {
  let token = ''
  if (config.auth.type === 'oauth2') {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.auth.clientId!,
      client_secret: config.auth.clientSecret!,
    })
    const resp = await fetch(config.auth.tokenUrl!, { method: 'POST', body })
    const json = await resp.json()
    token = json.access_token
  }

  const results: any[] = []
  let page = 1
  while (true) {
    const url = new URL(config.baseUrl)
    if (config.pageParam) url.searchParams.set(config.pageParam, String(page))
    if (config.pageSize) url.searchParams.set('limit', String(config.pageSize))
    const resp = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : `Bearer ${config.auth.apiKey}`,
      },
    })
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) break
    results.push(...data)
    page++
  }
  return results
}

async function parseCsvOrExcel(config: CsvConfig): Promise<any[]> {
  const resp = await fetch(config.url)
  const text = await resp.text()
  const lines = text.trim().split(/\r?\n/)
  const header = lines.shift()?.split(',') ?? []
  const records: any[] = []
  for (const line of lines) {
    const cols = line.split(',')
    const rec: any = {}
    header.forEach((h, i) => {
      const mapped = config.headers[h] || h
      rec[mapped] = cols[i]
    })
    records.push(rec)
  }
  return records
}

async function scrapeWebsite(config: ScrapeConfig): Promise<any[]> {
  if (config.respectRobots !== false) {
    const robots = await fetch(new URL('/robots.txt', config.url))
    if (robots.ok) {
      const txt = await robots.text()
      if (txt.includes('Disallow: /')) throw new Error('Scraping disallowed by robots.txt')
    }
  }
  const resp = await fetch(config.url)
  const html = await resp.text()
  const products: any[] = []
  const regex = /data-product='(\{[^']+\})'/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    products.push(JSON.parse(match[1]))
  }
  return products
}

function normalizeRecord(rec: any, headerMap?: Record<string, string>) {
  const sku = rec.sku || rec.SKU || rec.supplier_sku
  const name = rec.name || rec.description
  const unit = rec.unit || rec.UOM
  const packQty = Number(rec.pack_qty || rec.packQty || 1)
  
  // Extract category path from various fields
  let categoryPath: string[] | null = null
  if (rec.categoryPath && Array.isArray(rec.categoryPath)) {
    categoryPath = rec.categoryPath
  } else if (rec.category_path && Array.isArray(rec.category_path)) {
    categoryPath = rec.category_path
  } else if (rec.category) {
    // Single category string - convert to array
    categoryPath = [rec.category]
  } else if (rec.categories) {
    // String of categories separated by commas or > 
    categoryPath = rec.categories.split(/[,>]/).map((c: string) => c.trim()).filter(Boolean)
  }
  
  return { 
    supplier_sku: sku, 
    name, 
    unit, 
    pack_qty: packQty, 
    category_path: categoryPath,
    raw: rec 
  }
}

async function upsertSupplierProduct(supabase: any, supplierId: string, supplierSku: string, normalized: any, raw: any) {
  const raw_hash = await computeHash(raw)
  const now = new Date().toISOString()

  await supabase.from('stg_supplier_products_raw').insert({
    supplier_id: supplierId,
    supplier_sku: supplierSku,
    payload: raw,
    source_info: { normalized_at: now },
    raw_hash,
  })

  const { data: existing } = await supabase
    .from('supplier_product')
    .select('first_seen_at')
    .eq('supplier_id', supplierId)
    .eq('supplier_sku', supplierSku)
    .maybeSingle()

  await supabase.from('supplier_product').upsert(
    {
      supplier_id: supplierId,
      supplier_sku: supplierSku,
      name: normalized.name,
      pack_size: normalized.unit,
      category_path: normalized.category_path,
      raw_hash,
      data_provenance: 'ingest-supplier-products',
      first_seen_at: existing?.first_seen_at ?? now,
      last_seen_at: now,
    },
    { onConflict: 'supplier_id,supplier_sku' }
  )
}

async function computeHash(payload: any): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
