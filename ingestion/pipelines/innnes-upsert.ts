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
    availabilityText?: string; imageUrl?: string; rawHash: string;
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

      const availabilityText = norm($el.find(".productcard__availability").first().text()) || undefined;

      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));

      const urlAbs = absUrl(href);
      out.push({
        name, url: urlAbs, supplierSku, packSize, availabilityText, imageUrl,
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

async function matchCatalog(name: string, packSize?: string) {
  // simple heuristic: match by name (and size if present)
  const { data: candidates, error } = await sb
    .from("catalog_product")
    .select("catalog_id,name,size")
    .ilike("name", `%${name.slice(0, 48)}%`)
    .limit(20);

  if (error) throw error;

  const pick = candidates?.find(c =>
    (!packSize || (c.size || "").replace(/\s/g, "").toLowerCase() === packSize.toLowerCase())
  );
  return pick?.catalog_id || null;
}

async function upsertSupplierProduct(catalogId: string | null, i: {
  name: string;
  supplierSku: string;
  url: string;
  packSize?: string;
  availabilityText?: string;
  imageUrl?: string;
  rawHash: string;
}) {
  // Check existing to avoid needless updates when raw_hash matches
  const { data: existing } = await sb
    .from("supplier_product")
    .select("raw_hash")
    .eq("supplier_id", SUPPLIER_ID)
    .eq("supplier_sku", i.supplierSku)
    .maybeSingle();

  if (existing && existing.raw_hash === i.rawHash) {
    const { error: updErr } = await sb
      .from("supplier_product")
      .update({ last_seen_at: new Date().toISOString(), catalog_id: catalogId })
      .eq("supplier_id", SUPPLIER_ID)
      .eq("supplier_sku", i.supplierSku);
    if (updErr) throw updErr;
    return;
  }

  const payload: any = {
    supplier_id: SUPPLIER_ID,
    catalog_id: catalogId,
    supplier_sku: i.supplierSku,
    pack_size: i.packSize ?? null,
    source_url: i.url,
    availability_text: i.availabilityText ?? null,
    image_url: i.imageUrl ?? null,
    data_provenance: "site",
    provenance_confidence: 0.7,
    raw_hash: i.rawHash,
    raw_payload_json: i,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from("supplier_product")
    .upsert(payload, { onConflict: "supplier_id,supplier_sku" });
  if (error) throw error;
}

async function recordUnmatched(i: { name: string; supplierSku: string }) {
  const { data: existing } = await sb
    .from("unmatched_products")
    .select("unmatched_id")
    .eq("supplier_id", SUPPLIER_ID)
    .eq("supplier_sku", i.supplierSku)
    .maybeSingle();

  const payload = {
    supplier_id: SUPPLIER_ID,
    supplier_sku: i.supplierSku,
    raw_name: i.name,
    payload: i,
  };

  if (existing) {
    await sb
      .from("unmatched_products")
      .update(payload)
      .eq("unmatched_id", existing.unmatched_id);
  } else {
    await sb.from("unmatched_products").insert(payload);
  }
}

async function run() {
  let total = 0;
  for (const url of CATEGORY_URLS) {
    const items = await scrapeCategory(url);
    console.log(`Category ${url} → ${items.length} deduped items`);
    total += items.length;

    for (const it of items) {
      const catalogId = await matchCatalog(it.name, it.packSize);
      await upsertSupplierProduct(catalogId, it);
      if (!catalogId) await recordUnmatched(it);
    }
  }
  console.log(`Upserted ${total} items for supplier ${SUPPLIER_ID}`);
}

run().catch(err => { console.error(err); process.exit(1); });
