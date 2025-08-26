// Run with:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPPLIER_ID=INNNES
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
const SUPPLIER_ID = process.env.SUPPLIER_ID || "INNNES"; // simple text id is fine with our schema

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CARD_SEL = [
  ".productcard__container",
  ".productcard",
  "ul.products li.product",
].join(",");

const norm = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();
const absUrl = (href?: string) => {
  try {
    return new URL(href!, BASE).href;
  } catch {
    return href || "";
  }
};
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

type ScrapedItem = {
  name: string;
  url: string;
  supplierSku: string;
  packSize?: string;
  availabilityText?: string;
  imageUrl?: string;
  rawHash: string;
};

async function scrapeCategory(categoryUrl: string): Promise<ScrapedItem[]> {
  const out: ScrapedItem[] = [];
  const seenItem = new Set<string>();

  const fetchPage = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "accept-language": "is-IS,is;q=0.9,en;q=0.8",
        "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)",
      },
    });
    const html = await res.text();
    return cheerio.load(html);
  };

  const scrapeOne = ($: cheerio.CheerioAPI, pageUrl: string) => {
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
      const packSize =
        (packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || "")
          .replace(/\s+/g, "") || undefined;

      const availabilityText = norm($el.find(".productcard__availability").first().text()) || undefined;
      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));
      const urlAbs = absUrl(href);

      const key = `${supplierSku}::${urlAbs}`;
      if (seenItem.has(key)) return;
      seenItem.add(key);

      out.push({
        name,
        url: urlAbs,
        supplierSku,
        packSize,
        availabilityText,
        imageUrl,
        rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku })),
      });
    });

    console.log(`Scraped page ${pageUrl} → ${out.length} total`);
  };

  // 1) Load first page to discover numbers and a query template
  const $first = await fetchPage(categoryUrl);

  // read numeric buttons (max page)
  const nums = $first(".pagination a, .pagination__item, .page-numbers a")
    .map((_, el) => parseInt(norm($first(el).text()), 10))
    .get()
    .filter((n) => Number.isFinite(n));
  const maxPage = Math.max(...nums, 1);

  // find a link that contains the page param (e.g., ?page=2&filter=&orderby=)
  let queryTemplate = "";
  $first(".pagination a[href], .pagination__item a[href], .page-numbers a[href]").each((_, a) => {
    const href = absUrl($first(a).attr("href"));
    const u = new URL(href);
    const hasPageParam = [...u.searchParams.keys()].some((k) => /^(page|p)$/i.test(k));
    if (hasPageParam && !queryTemplate) {
      // keep everything but the page number so we can re-use it with our category base
      // e.g. "?page={n}&filter=&orderby="
      const pageKey = [...u.searchParams.keys()].find((k) => /^(page|p)$/i.test(k))!;
      u.searchParams.set(pageKey, "{n}");
      queryTemplate = "?" + u.searchParams.toString().replace("%7Bn%7D", "{n}");
    }
  });
    console.log("pagination template:", queryTemplate || "(none)");


  // helper to build a page URL from template
const buildUrl = (n: number) => {
  const base = new URL(categoryUrl);
  base.search = "";

  if (queryTemplate) {
    return base.origin + base.pathname + queryTemplate.replace("{n}", String(n));
  }

  // fallback #1: ?page=N
  const u = new URL(categoryUrl);
  u.searchParams.set("page", String(n));

  // fallback #2: /page/N/ (WooCommerce style)
  const alt = new URL(categoryUrl);
  const parts = alt.pathname.replace(/\/+$/, "").split("/");
  alt.pathname = n === 1
    ? parts.join("/") + "/"
    : parts.concat(["page", String(n)]).join("/") + "/";

  return n === 1 ? categoryUrl : u.toString(); // if needed, swap to alt.toString()
};

  // 2) Scrape page 1
  scrapeOne($first, categoryUrl);

// 3) Scrape remaining pages: keep going until a page adds 0 new items
let p = 2;
let emptyStreak = 0;            // stop after two empty pages in a row (safety)
const HARD_CAP = 100;           // absolute max

while (p <= HARD_CAP && emptyStreak < 2) {
  const pageUrl = buildUrl(p);
  const $ = await fetchPage(pageUrl);
  const before = out.length;
  scrapeOne($, pageUrl);
  const added = out.length - before;

  if (added === 0) {
    emptyStreak += 1;
  } else {
    emptyStreak = 0;
  }

  console.log(`page=${p} added=${added} total=${out.length}`);
  p += 1;

  await new Promise(r => setTimeout(r, 350)); // polite delay
}

  return out;
}


/** Find an existing catalog_product by name/size, or create one. Returns its catalog_id. */
async function matchOrCreateCatalog(name: string, packSize?: string): Promise<string> {
  const { data: candidates, error } = await sb
    .from("catalog_product")
    .select("catalog_id,name,size")
    .ilike("name", `%${name.slice(0, 48)}%`)
    .limit(20);

  if (error) throw error;

  const pick = candidates?.find(
    (c) =>
      !packSize ||
      (c.size || "").replace(/\s/g, "").toLowerCase() === packSize.toLowerCase()
  );
  if (pick?.catalog_id) return pick.catalog_id;

  const { data: created, error: insErr } = await sb
    .from("catalog_product")
    .insert({ name, size: packSize ?? null })
    .select("catalog_id")
    .single();

  if (insErr) throw insErr;
  return created!.catalog_id;
}

async function upsertSupplierProduct(catalogId: string, i: ScrapedItem) {
  const payload = {
    catalog_id: catalogId,
    supplier_id: SUPPLIER_ID,
    supplier_sku: i.supplierSku,
    pack_size: i.packSize ?? null,
    source_url: i.url,
    availability_text: i.availabilityText ?? null,
    image_url: i.imageUrl ?? null,
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

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
