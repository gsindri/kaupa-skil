// Run with:
// pnpm tsx ingestion/probes/innnes-probe.ts

import { chromium, Page } from "playwright";

const CATEGORY_URL = "https://innnes.is/avextir-og-graenmeti/";
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

// Common product card selectors (WooCommerce-ish + fallbacks)
const CARD_SEL = [
  "ul.products li.product",
  ".products .product",
  "article.product",
  ".product-card",
  ".productgrid-item",
  "[data-product-id]"
].join(",");

async function maybeAcceptCookies(page: Page) {
  const candidates = [
    'button:has-text("Samþykkja allt")',
    'button:has-text("Samþykkja")',
    'button:has-text("Leyfa allt")',
    'button:has-text("Accept")',
    '[id*="accept"]',
  ];
  for (const s of candidates) {
    const b = await page.$(s);
    if (b) {
      try { await b.click(); await page.waitForTimeout(300); } catch {}
      break;
    }
  }
}

async function waitForAnyCards(page: Page) {
  for (let i = 0; i < 15; i++) {
    const n = await page.$$eval(CARD_SEL, els => els.length).catch(() => 0);
    if (n > 0) return n;
    await page.waitForTimeout(400);
  }
  return 0;
}

async function autoScroll(page: Page) {
  let prev = 0;
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 1400);
    await page.waitForTimeout(600 + Math.random() * 300);
    const n = await page.$$eval(CARD_SEL, els => els.length).catch(() => 0);
    if (n === prev) break;
    prev = n;
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: UA,
    locale: "is-IS",
    timezoneId: "Atlantic/Reykjavik",
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  try {
    await page.goto(CATEGORY_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await maybeAcceptCookies(page);

    // Give client JS a moment
    let count = await waitForAnyCards(page);
    if (count === 0) {
      // Try a gentle scroll in case of lazy-render
      await autoScroll(page);
      count = await waitForAnyCards(page);
    }

    // Save artifacts either way
    await page.screenshot({ path: "innnes_probe.png", fullPage: true }).catch(() => {});
    const html = await page.content();
    await import("node:fs/promises").then(fs => fs.writeFile("innnes_probe.html", html));

    console.log(`Cards found: ${count}`);
    if (count > 0) {
      // Print first 5 names/links to confirm selector quality
      const sample = await page.evaluate((sel) => {
        const toText = (el?: Element | null) => (el?.textContent || "").replace(/\s+/g, " ").trim();
        return Array.from(document.querySelectorAll(sel))
          .slice(0, 5)
          .map(el => {
            const a = el.querySelector<HTMLAnchorElement>("a[href]");
            const titleEl = el.querySelector("h2, h3, .woocommerce-loop-product__title, .product-title");
            const name = toText(titleEl || a);
            const url = a?.href || "";
            return { name, url };
          });
      }, CARD_SEL);
      console.log("Sample:", sample);
    } else {
      console.warn("No cards detected. See innnes_probe.png & innnes_probe.html for debugging.");
    }
  } finally {
    await ctx.close();
    await browser.close();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
