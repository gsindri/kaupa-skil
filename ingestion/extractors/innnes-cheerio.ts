// Run with:
// pnpm tsx ingestion/extractors/innnes-cheerio.ts

import { fetch } from "undici";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const BASE = "https://innnes.is";
const START_URLS = [
  `${BASE}/avextir-og-graenmeti/`,
  // add more categories here later
];

// robust selectors for Innnes product cards
const CARD_SEL = [
  ".productcard__container",
  ".productcard",                // fallback
  "ul.products li.product"       // generic fallback
].join(",");

function norm(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function absUrl(href?: string) {
  try { return new URL(href!, BASE).href; } catch { return href || ""; }
}
function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

async function scrapeCategory(url: string) {
  const out: any[] = [];
  let pageUrl: string | undefined = url;

  while (pageUrl) {
    const html = await (await fetch(pageUrl, {
      headers: {
        "accept-language": "is-IS,is;q=0.9,en;q=0.8",
        "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)"
      }
    })).text();

    const $ = cheerio.load(html);

    // grab cards
    $(CARD_SEL).each((_, el) => {
      const $el = $(el);

      // title
      const name =
        norm($el.find("h3.productcard__heading").first().text()) ||
        norm($el.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text());

      // link
      const href =
        $el.find("a[href]").first().attr("href") ||
        $el.find(".productcard__image a[href], .productcard__heading a[href]").attr("href") ||
        "";

      // sku
      const skuText =
        norm($el.find(".productcard__sku, [class*=sku]").first().text()) || "";
      const skuMatch =
        skuText.match(/[A-Z0-9][A-Z0-9\-_.]{3,}/i)?.[0] ||
        absUrl(href).split("/").filter(Boolean).pop(); // slug fallback

      // pack / size
      const packText = norm($el.find(".productcard__size, .productcard__unit").first().text()) ||
                       norm($el.find(".woocommerce-product-details__short-description").first().text());
      const packSize = (packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || "")
                        .replace(/\s+/g, "")
                        || undefined;

      // availability
      const availabilityText = norm($el.find(".productcard__availability").first().text())
                        || undefined;

      // image
      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));

      if (name && href) {
        const urlAbs = absUrl(href);
        out.push({
          name,
          url: urlAbs,
          supplierSku: skuMatch,
          packSize,
          availabilityText,
          imageUrl,
          dataProvenance: "site",
          provenanceConfidence: 0.7,
          rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku: skuMatch }))
        });
      }
    });

    // pagination (next)
    const nextHref =
      $("a[rel=next]").attr("href") ||
      $(".pagination__item--active").next().find("a[href]").attr("href") ||
      $(".pagination .page-numbers .next").attr("href") ||
      undefined;

    pageUrl = nextHref ? absUrl(nextHref) : undefined;
  }

  return out;
}

async function run() {
  let total = 0;
  for (const u of START_URLS) {
    const items = await scrapeCategory(u);
    total += items.length;
    console.log(`Category ${u} → ${items.length} items`);
    console.log(items.slice(0, 5)); // sample preview
  }
  console.log(`Done. Total items: ${total}`);
}

run().catch(err => { console.error(err); process.exit(1); });
