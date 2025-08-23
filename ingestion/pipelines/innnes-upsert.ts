// Run with:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPPLIER_ID=<your suppliers.id for Innnes>
// pnpm tsx ingestion/pipelines/innnes-upsert.ts

import { createClient } from "@supabase/supabase-js";
import { fetch } from "undici";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const BASE = "https://innnes.is";
const CATEGORY_URLS = [
  `${BASE}/avextir-og-graenmeti/`,
  // add more Innnes categories here as needed
];

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPPLIER_ID = process.env.SUPPLIER_ID!; // <- set to your suppliers.id (UUID)

const CARD_SEL = [
  ".productcard__container",
  ".productcard",
  "ul.products li.product"
].join(",");

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const norm = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();
const absUrl = (href?: string) => { try { return new URL(href!, BASE).href; } catch { return href || ""; } };
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function scrapeCategory(url: string) {
  const out: {
    name: string; url: string; supplierSku: string; packSize?: string;
    availability?: string; imageUrl?: string; rawHash: string;
  }[] = [];

  let pageUrl: string | undefined = url;
  while (pageUrl) {
    const res = await fetch(pageUrl, {
      headers: {
        "accept-language": "is-IS,is;q=0.9,en;q=0.8",
        "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    $(CARD_SEL).each((_, el) => {
      const $el = $(el);
      const name =
        norm($el.find("h3.productcard__heading").first().text()) ||
        norm($el.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text());
      const href =
        $el.find("a[href]").first().attr("href") ||
        $el.find(".productcard__image a[href], .productcard__heading a[href]").attr("href") || "";
      if (!name || !href) return;

      const skuText = norm($el.find(".productcard__sku, [class*=sku]").first().text());
      const supplierSku = (skuText.match(/[A-Z0-9][A-Z0-9\-_.]{3,}/i)?.[0]
        || absUrl(href).split("/").filter(Boolean).pop()
        || absUrl(href));

      const packText = norm($el.find(".productcard__size, .productcard__unit").first().text());
      const packSize = (packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || "")
        .replace(/\s+/g, "") || undefined;

      const availability = norm($el.find(".productcard__availability").first().text()) || undefined;

      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));

      const urlAbs = absUrl(href);
      out.push({
        name, url: urlAbs, supplierSku, packSize, availability, imageUrl,
        rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku }))
      });
    });

    // naive pagination: rel=next or “active + next sibling”
    const nextHref =
      $("a[rel=next]").attr("href") ||
      $(".pagination__item--active").next().find("a[href]").attr("href") ||
      $(".pagination .page-numbers .next").attr("href") || undefined;
    pageUrl = nextHref ? absUrl(nextHref) : undefined;
  }

  // de-dupe (some cards repeat) by supplierSku+url
  const seen = new Set<string>();
  return out.filter(i => {
    const key = `${i.supplierSku}::${i.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function matchOrCreateCatalog(name: string, packSize?: string) {
  // simple heuristic: match by name (and size if present)
  const { data: candidates, error } = await sb
    .from("catalog_product")
    .select("id,name,size")
    .ilike("name", `%${name.slice(0, 48)}%`)
    .limit(20);

  if (error) throw error;

  const pick = candidates?.find(c =>
    (!packSize || (c.size || "").replace(/\s/g, "").toLowerCase() === packSize.toLowerCase())
  );
  if (pick?.id) return pick.id;

  const { data: created, error: insErr } = await sb
    .from("catalog_product")
    .insert({ name, size: packSize ?? null })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created!.id;
}

async function upsertSupplierProduct(catalogId: string, i: {
  supplierSku: string; url: string; packSize?: string; rawHash: string;
}) {
  // NOTE: adjust column names if your FK is catalog_product_id (most likely)
  const payload: any = {
    supplier_id: SUPPLIER_ID,
    catalog_product_id: catalogId,         // <-- change to 'catalog_id' if that's your column
    supplier_sku: i.supplierSku,
    pack_size: i.packSize ?? null,         // <-- drop if you don't have this column
    source_url: i.url,
    data_provenance: "site",
    provenance_confidence: 0.7,
    raw_hash: i.rawHash,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from("supplier_product")
    .upsert(payload, { onConflict: "supplier_id,supplier_sku" });
  if (error) throw error;
}

async function run() {
  let total = 0;
  for (const url of CATEGORY_URLS) {
    const items = await scrapeCategory(url);
    console.log(`Category ${url} → ${items.length} deduped items`);
    total += items.length;

    for (const it of items) {
      const catalogId = await matchOrCreateCatalog(it.name, it.packSize);
      await upsertSupplierProduct(catalogId, it);
    }
  }
  console.log(`Upserted ${total} items for supplier ${SUPPLIER_ID}`);
}

run().catch(err => { console.error(err); process.exit(1); });
