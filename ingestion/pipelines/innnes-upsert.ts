// Run with:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPPLIER_ID=INNNES
// pnpm tsx ingestion/pipelines/innnes-upsert.ts

import { createClient } from "@supabase/supabase-js";
import { fetch } from "undici";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const BASE = "https://innnes.is";

/**
 * Add any category landing pages you want to scrape here.
 * Example new category from your screenshot: "Brauð, eftirréttir og ís"
 * (Update the URL to match the site’s actual slug.)
 */
const CATEGORY_URLS = [
  `${BASE}/avextir-og-graenmeti/`,
  `${BASE}/braud-eftirrettir-og-is/`,    // <- uncomment when ready
  // `${BASE}/drykkir/`,
  // ...
];

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPPLIER_ID = process.env.SUPPLIER_ID || "INNNES";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CARD_SEL = [
  ".productcard__container",
  ".productcard",
  "ul.products li.product",
].join(",");

const norm = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const absUrl = (href?: string) => {
  try {
    return new URL(href!, BASE).href;
  } catch {
    return href || "";
  }
};

type ScrapedItem = {
  name: string;
  url: string;
  supplierSku: string;
  packSize?: string;
  availabilityText?: string;
  imageUrl?: string;
  categoryPath?: string[];      // NEW: will be stored in supplier_product.category_path
  rawHash: string;
};

/** Try to read a breadcrumb trail; if missing, fall back to a path-derived label */
function deriveCategoryPath($: cheerio.CheerioAPI, pageUrl: string): string[] | undefined {
  const crumbs = $('nav.breadcrumb, .breadcrumb, .breadcrumbs, .c-breadcrumbs')
    .find('li, a, span')
    .map((_, el) => norm($(el).text()))
    .get()
    .filter(Boolean);

  // Drop very generic starts like "Heim" / "Home"
  const cleaned = crumbs.filter(t => !/^heim$|^home$/i.test(t));

  if (cleaned.length) return cleaned;

  // Fallback: last path segment prettified
  const u = new URL(pageUrl);
  const segs = u.pathname.split("/").filter(Boolean);
  const last = segs.pop();
  if (last) {
    const pretty = last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return [pretty];
  }
  return undefined;
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: {
      "accept-language": "is-IS,is;q=0.9,en;q=0.8",
      "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  const html = await res.text();
  return cheerio.load(html);
}

function buildPaginator(categoryUrl: string, $first: cheerio.CheerioAPI) {
  // Try to detect a template like ?page={n}&filter=&orderby=  (or p=)
  let template = "";
  const cand = $first(".pagination a[href], .pagination__item a[href], .page-numbers a[href]")
    .map((_, a) => absUrl($first(a).attr("href")))
    .get()
    .find(Boolean);

  if (cand) {
    try {
      const u = new URL(cand);
      const pageKey = [...u.searchParams.keys()].find(k => /^(page|p)$/i.test(k));
      if (pageKey) {
        u.searchParams.set(pageKey, "{n}");
        template = "?" + u.searchParams.toString().replace("%7Bn%7D", "{n}");
      }
    } catch {}
  }

  return (n: number) => {
    const base = new URL(categoryUrl);
    base.search = "";
    if (template) {
      return base.origin + base.pathname + template.replace("{n}", String(n));
    }
    // fallback #1: ?page=N
    const u = new URL(categoryUrl);
    u.searchParams.set("page", String(n));
    // fallback #2 (WooCommerce style): /page/N/
    const alt = new URL(categoryUrl);
    const parts = alt.pathname.replace(/\/+$/, "").split("/");
    alt.pathname = n === 1
      ? parts.join("/") + "/"
      : parts.concat(["page", String(n)]).join("/") + "/";
    return n === 1 ? categoryUrl : u.toString(); // swap to alt if needed
  };
}

async function scrapeCategory(categoryUrl: string): Promise<ScrapedItem[]> {
  const out: ScrapedItem[] = [];
  const seen = new Set<string>();

  // First page (also used to derive categoryPath + pagination)
  const $first = await fetchPage(categoryUrl);
  const categoryPath = deriveCategoryPath($first, categoryUrl);

  const pushOne = ($: cheerio.CheerioAPI, pageUrl: string) => {
    $(CARD_SEL).each((_, el) => {
      const $el = $(el);
      const name =
        norm($el.find("h3.productcard__heading").first().text()) ||
        norm($el.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text());
      const href =
        $el.find("a[href]").first().attr("href") ||
        $el.find(".productcard__image a[href], .productcard__heading a[href]").attr("href") ||
        "";
      if (!name || !href) return;

      const skuText = norm($el.find(".productcard__sku, [class*=sku]").first().text());
      const supplierSku =
        skuText.match(/[A-Z0-9][A-Z0-9\-_.]{3,}/i)?.[0] ||
        absUrl(href).split("/").filter(Boolean).pop() ||
        absUrl(href);

      const packText = norm($el.find(".productcard__size, .productcard__unit").first().text());
      const packSize = (
        packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || ""
      ).replace(/\s+/g, "") || undefined;

      const availabilityText = norm($el.find(".productcard__availability").first().text()) || undefined;
      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));
      const urlAbs = absUrl(href);

      const key = `${supplierSku}::${urlAbs}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        name,
        url: urlAbs,
        supplierSku,
        packSize,
        availabilityText,
        imageUrl,
        categoryPath, // same for all items on this category page
        rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku })),
      });
    });
    console.log(`Scraped page ${pageUrl} → ${out.length} total`);
  };

  // Scrape first page
  pushOne($first, categoryUrl);

  // Discover and iterate subsequent pages with a safety stop
  const pageUrlFor = buildPaginator(categoryUrl, $first);
  let p = 2;
  let emptyStreak = 0;
  const HARD_CAP = 100;

  while (p <= HARD_CAP && emptyStreak < 2) {
    const pageUrl = pageUrlFor(p);
    try {
      const $ = await fetchPage(pageUrl);
      const before = out.length;
      pushOne($, pageUrl);
      const added = out.length - before;
      if (added === 0) emptyStreak += 1; else emptyStreak = 0;
      console.log(`page=${p} added=${added} total=${out.length}`);
      p += 1;
      await new Promise(r => setTimeout(r, 350)); // politeness
    } catch (e) {
      console.warn(`Failed ${pageUrl}: ${(e as Error).message}`);
      break;
    }
  }

  return out;
}

/** Find or create a catalog_product and return its id (UUID). */
async function matchOrCreateCatalog(name: string, packSize?: string): Promise<string> {
  const { data: candidates, error } = await sb
    .from("catalog_product")
    .select("id,name,size")
    .ilike("name", `%${name.slice(0, 48)}%`)
    .limit(20);

  if (error) throw error;

  const pick = candidates?.find(
    (c) => !packSize || (c.size || "").replace(/\s/g, "").toLowerCase() === packSize.toLowerCase()
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

/** Upsert supplier_product (FK: catalog_product_id). */
async function upsertSupplierProduct(catalogId: string, i: ScrapedItem) {
  const payload: any = {
    supplier_id: SUPPLIER_ID,
    catalog_product_id: catalogId,           // ✅ correct FK
    supplier_sku: i.supplierSku,
    pack_size: i.packSize ?? null,
    source_url: i.url,
    availability_text: i.availabilityText ?? null,
    image_url: i.imageUrl ?? null,
    category_path: i.categoryPath ?? null,   // ✅ new column if present
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
    // de-dupe across pages by (supplierSku,url)
    const uniq = new Map<string, ScrapedItem>();
    for (const it of items) uniq.set(`${it.supplierSku}::${it.url}`, it);
    const deduped = [...uniq.values()];

    console.log(`Category ${url} → ${deduped.length} deduped items`);
    total += deduped.length;

    for (const it of deduped) {
      const catalogId = await matchOrCreateCatalog(it.name, it.packSize);
      await upsertSupplierProduct(catalogId, it);
    }
  }
  console.log(`Upserted ${total} items for supplier ${SUPPLIER_ID}`);
}

run().catch(err => { console.error(err); process.exit(1); });
