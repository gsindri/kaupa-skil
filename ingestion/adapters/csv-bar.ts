import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const csvBarAdapter = (cfg: {
  supplierId: string; csvText: string; baseUrl?: string;
}): SupplierAdapter => ({
  key: 'bar_csv',
  async pull() {
    const records = parse(cfg.csvText, { columns: true, skip_empty_lines: true });
    return records.map((row: any) => ({
      supplierId: cfg.supplierId,
      sourceUrl: cfg.baseUrl,
      payload: row,
    })) as RawItem[];
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const r: any = payload;
      const supplierSku = String(r.sku ?? r.SKU ?? r.id ?? '').trim();
      const name = String(r.name ?? r.Title ?? '').trim();
      const brand = (r.brand ?? r.Brand ?? '').trim() || undefined;
      const gtin = (r.gtin ?? r.ean ?? '').trim() || undefined;
      const packSize = (r.pack ?? r.case ?? r.size ?? '').trim() || undefined;
      const imageUrl = (r.image ?? r.image_url ?? '').trim() || undefined;
      const rawHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      const base = normalizeBasics({ name, brand, packSize });
      return {
        supplierId, supplierSku, name: base.name,
        brand: base.brand, packSize: base.packSize,
        gtin, imageUrl, sourceUrl,
        dataProvenance: 'csv', provenanceConfidence: gtin ? 0.9 : 0.6, rawHash,
      } satisfies NormalizedItem;
    });
  }
});
