import { createClient } from '@supabase/supabase-js';
import type { SupplierAdapter } from './types';
import { matchOrCreateCatalog } from './match';

export async function runOnce(supabaseUrl: string, serviceRoleKey: string, supplierId: string, adapter: SupplierAdapter) {
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: job } = await sb.from('ingest_job').insert({
    supplier_id: supplierId,
    trigger: 'scheduler',
    status: 'running',
    started_at: new Date().toISOString(),
  }).select().single();

  try {
    const raw = await adapter.pull();

    for (const r of raw) {
      const rawHash = await sha256(JSON.stringify(r.payload));
      await sb.from('stg_supplier_products_raw').insert({
        supplier_id: r.supplierId,
        source_type: adapter.key.includes('api') ? 'api' : adapter.key.includes('csv') ? 'csv' : 'sitemap',
        source_url: r.sourceUrl ?? null,
        raw_payload: r.payload,
        raw_hash: rawHash,
      }).onConflict('supplier_id,raw_hash').ignore();
    }

    const normalized = await adapter.normalize(raw);

    for (const n of normalized) {
      const catalogId = await matchOrCreateCatalog(sb, n);
      await sb.from('supplier_product').upsert({
        supplier_id: n.supplierId,
        catalog_id: catalogId,
        supplier_sku: n.supplierSku,
        pack_size: n.packSize ?? null,
        availability_text: n.availabilityText ?? null,
        image_url: n.imageUrl ?? null,
        source_url: n.sourceUrl ?? null,
        data_provenance: n.dataProvenance,
        provenance_confidence: n.provenanceConfidence,
        raw_hash: n.rawHash,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'supplier_id,supplier_sku' });

      if (n.imageUrl) {
        sb.functions.invoke('fetch-image', { body: { catalogId, imageUrl: n.imageUrl } }).catch(() => {});
      }
    }

    await sb.from('ingest_job').update({ status: 'success', finished_at: new Date().toISOString() }).eq('id', job!.id);
  } catch (err: any) {
    await sb.from('ingest_job').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: String(err?.message ?? err),
    }).eq('id', job!.id);
    throw err;
  }
}

async function sha256(s: string) {
  const enc = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
