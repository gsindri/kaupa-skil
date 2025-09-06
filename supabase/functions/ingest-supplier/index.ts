import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cleanAvailabilityText } from './availability.ts'

// Types
type RawItem = {
  supplierId: string;
  sourceUrl?: string;
  payload: unknown;
};

type NormalizedItem = {
  supplierId: string;
  supplierSku: string;
  name: string;
  brand?: string;
  packSize?: string;
  gtin?: string;
  categoryPath?: string[];
  imageUrl?: string;
  availabilityText?: string;
  sourceUrl?: string;
  dataProvenance: 'api'|'csv'|'sitemap'|'manual';
  provenanceConfidence: number;
  rawHash: string;
};

interface SupplierAdapter {
  key: string;
  pull(): Promise<RawItem[]>;
  normalize(rows: RawItem[]): Promise<NormalizedItem[]>;
}

// Utility functions
function normalizeBasics(i: { name?: string; brand?: string; packSize?: string }) {
  const name = (i.name ?? '').replace(/\s+/g, ' ').trim();
  const brand = i.brand?.trim();
  const packSize = i.packSize?.toLowerCase().replace(/\s/g, '');
  return { name, brand, packSize };
}

async function sha256(s: string) {
  const enc = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeHash(payload: any): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// CSV parsing function (simplified)
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split(/\r?\n/);
  const header = lines.shift()?.split(',') ?? [];
  const records: any[] = [];
  
  for (const line of lines) {
    const cols = line.split(',');
    const record: any = {};
    header.forEach((h, i) => {
      record[h.trim()] = cols[i]?.trim() || '';
    });
    records.push(record);
  }
  
  return records;
}

// CSV adapter
const csvBarAdapter = (cfg: {
  supplierId: string; csvText: string; baseUrl?: string;
}): SupplierAdapter => ({
  key: 'bar_csv',
  async pull() {
    const records = parseCSV(cfg.csvText);
    return records.map((row: any) => ({
      supplierId: cfg.supplierId,
      sourceUrl: cfg.baseUrl,
      payload: row,
    })) as RawItem[];
  },
  async normalize(rows) {
    return Promise.all(rows.map(async ({ supplierId, sourceUrl, payload }: RawItem) => {
      const r: any = payload;
      const supplierSku = String(r.sku ?? r.SKU ?? r.id ?? '').trim();
      const name = String(r.name ?? r.Title ?? '').trim();
      const brand = (r.brand ?? r.Brand ?? '').trim() || undefined;
      const gtin = (r.gtin ?? r.ean ?? '').trim() || undefined;
      const packSize = (r.pack ?? r.case ?? r.size ?? '').trim() || undefined;
      const imageUrl = (r.image ?? r.image_url ?? '').trim() || undefined;
      
      // Extract category path
      let categoryPath: string[] | undefined = undefined;
      if (r.categoryPath && Array.isArray(r.categoryPath)) {
        categoryPath = r.categoryPath;
      } else if (r.category_path && Array.isArray(r.category_path)) {
        categoryPath = r.category_path;
      } else if (r.category) {
        categoryPath = [r.category];
      } else if (r.categories) {
        categoryPath = r.categories.split(/[,>]/).map((c: string) => c.trim()).filter(Boolean);
      }
      
      const rawHash = await computeHash(payload);
      const base = normalizeBasics({ name, brand, packSize });
      
      return {
        supplierId, 
        supplierSku, 
        name: base.name,
        brand: base.brand, 
        packSize: base.packSize,
        gtin, 
        categoryPath,
        imageUrl, 
        sourceUrl,
        dataProvenance: 'csv', 
        provenanceConfidence: gtin ? 0.9 : 0.6, 
        rawHash,
      } as NormalizedItem;
    }));
  }
});

// Match or create catalog function
async function matchOrCreateCatalog(
  sb: ReturnType<typeof createClient>, item: NormalizedItem
): Promise<string> {
  if (item.gtin) {
    const { data } = await sb
      .from('catalog_product')
      .select('id')
      .eq('gtin', item.gtin)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: candidates } = await sb
    .from('catalog_product')
    .select('id, brand, name, size')
    .ilike('name', `%${item.name.slice(0, 32)}%`)
    .limit(20);

  const pick = candidates?.find(c =>
    (item.brand ? c.brand?.toLowerCase() === item.brand.toLowerCase() : true) &&
    (item.packSize ? c.size?.replace(/\s/g,'').toLowerCase() === item.packSize : true)
  );

  if (pick?.id) return pick.id;

  const { data: created, error } = await sb
    .from('catalog_product')
    .insert({
      gtin: item.gtin ?? null,
      brand: item.brand ?? null,
      name: item.name,
      size: item.packSize ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return created!.id;
}

// Main runner function
async function runOnce(supabaseUrl: string, serviceRoleKey: string, supplierId: string, adapter: SupplierAdapter) {
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const raw = await adapter.pull();

    // Insert raw data
    for (const r of raw) {
      const rawHash = await sha256(JSON.stringify(r.payload));
      await sb.from('stg_supplier_products_raw').insert({
        supplier_id: r.supplierId,
        supplier_sku: String(r.payload).slice(0, 100), // Fallback SKU
        payload: r.payload,
        source_info: { source_url: r.sourceUrl },
        raw_hash: rawHash,
      }).onConflict('supplier_id,raw_hash').ignore();
    }

    // Normalize and insert products
    const normalized = await adapter.normalize(raw);

    for (const n of normalized) {
      const catalogId = await matchOrCreateCatalog(sb, n);
      const now = new Date().toISOString();

      const availabilityText = cleanAvailabilityText(n.availabilityText);

      // Check if product exists
      const { data: existing } = await sb
        .from('supplier_product')
        .select('first_seen_at')
        .eq('supplier_id', n.supplierId)
        .eq('supplier_sku', n.supplierSku)
        .maybeSingle();

      await sb.from('supplier_product').upsert({
        supplier_id: n.supplierId,
        catalog_product_id: catalogId,
        supplier_sku: n.supplierSku,
        pack_size: n.packSize ?? null,
        category_path: n.categoryPath ?? null,
        availability_text: availabilityText,
        image_url: n.imageUrl ?? null,
        source_url: n.sourceUrl ?? null,
        data_provenance: n.dataProvenance,
        provenance_confidence: n.provenanceConfidence,
        raw_hash: n.rawHash,
        first_seen_at: existing?.first_seen_at ?? now,
        last_seen_at: now,
      }, { onConflict: 'supplier_id,supplier_sku' });

      // Trigger image fetch if available
      if (n.imageUrl) {
        sb.functions.invoke('fetch-image', {
          body: { catalogId, imageUrl: n.imageUrl }
        }).catch(() => {});
      }
    }

  } catch (err: any) {
    console.error('Ingestion error:', err);
    throw err;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Edge function handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supplierId = url.searchParams.get('supplier_id');
    if (!supplierId) {
      return new Response('supplier_id required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const csvText = await req.text();
    const adapter = csvBarAdapter({ supplierId, csvText });

    await runOnce(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      supplierId,
      adapter
    );

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});