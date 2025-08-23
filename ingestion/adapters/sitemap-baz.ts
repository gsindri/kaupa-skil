import { createHash } from 'node:crypto';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const sitemapBazAdapter = (cfg: { supplierId: string; sitemapUrl: string; }): SupplierAdapter => ({
  key: 'baz_sitemap',
  async pull() {
    const res = await fetch(cfg.sitemapUrl);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const items: RawItem[] = [];
    for (const url of urls) {
      const page = await fetch(url);
      const payload = await page.json();
      items.push({ supplierId: cfg.supplierId, sourceUrl: url, payload });
    }
    return items;
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const p: any = payload;
      const base = normalizeBasics({ name: p.name, brand: p.brand, packSize: p.packSize });
      return {
        supplierId,
        supplierSku: String(p.sku),
        name: base.name,
        brand: base.brand,
        packSize: base.packSize,
        gtin: p.gtin ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        sourceUrl,
        dataProvenance: 'sitemap',
        provenanceConfidence: p.gtin ? 0.9 : 0.7,
        rawHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
      } as NormalizedItem;
    });
  }
});
