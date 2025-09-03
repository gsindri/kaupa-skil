import { createHash } from 'node:crypto';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const apiFooAdapter = (cfg: { supplierId: string; apiUrl: string; apiKey: string; }): SupplierAdapter => ({
  key: 'foo_api',
  async pull() {
    const res = await fetch(`${cfg.apiUrl}/products`, { headers: { Authorization: `Bearer ${cfg.apiKey}` }});
    const json = await res.json();
    return json.items.map((p: any) => ({ supplierId: cfg.supplierId, sourceUrl: `${cfg.apiUrl}/products/${p.id}`, payload: p })) as RawItem[];
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const p: any = payload;
      const base = normalizeBasics({ name: p.title, brand: p.brand, packSize: p.pack });
      return {
        supplierId,
        supplierSku: String(p.sku ?? p.id),
        name: base.name,
        brand: base.brand,
        packSize: base.packSize,
        gtin: p.gtin ?? undefined,
        categoryPath: p.categoryPath ?? p.category_path ?? (p.category ? [p.category] : undefined),
        imageUrl: p.image ?? undefined,
        sourceUrl,
        dataProvenance: 'api',
        provenanceConfidence: p.gtin ? 0.95 : 0.8,
        rawHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
      } as NormalizedItem;
    });
  }
});
