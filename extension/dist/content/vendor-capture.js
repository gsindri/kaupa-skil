"use strict";
(() => {
  // lib/selector-library.ts
  var SELECTORS = [
    "[data-price]",
    '[itemprop="price"]',
    ".price .amount",
    ".product-price",
    ".price",
    ".price__current"
  ];
  function pickPrice(doc) {
    for (const sel of SELECTORS) {
      const el = doc.querySelector(sel);
      if (el && el.textContent) {
        const priceText = el.textContent.trim();
        if (!priceText)
          continue;
        const currencyText = el.dataset.currency || void 0;
        const packEl = el.closest(".product")?.querySelector(".pack, .unit, .uom");
        const packText = packEl?.textContent?.trim() || void 0;
        const contextText = el.parentElement?.textContent?.trim() || void 0;
        return { priceText, currencyText, packText, contextText };
      }
    }
    return null;
  }

  // lib/price-normalizer.ts
  var SYMBOL_MAP = {
    "\u20AC": "EUR",
    "\xA3": "GBP",
    "$": "USD",
    "kr": "ISK",
    "ISK": "ISK"
  };
  function parseCurrencySymbol(text) {
    for (const [sym, code] of Object.entries(SYMBOL_MAP)) {
      if (text.includes(sym))
        return code;
    }
    const m = text.match(/\b[A-Z]{3}\b/);
    return m?.[0];
  }
  function normalizeDecimal(str) {
    return str.replace(/\s/g, "").replace(",", ".");
  }
  function parsePrice(text) {
    const m = text.match(/[\d.,]+/);
    return m ? parseFloat(normalizeDecimal(m[0])) : NaN;
  }
  function parsePack(text) {
    let m = text.match(/case of (\d+)/i);
    if (m)
      return { unit: "case", packSize: Number(m[1]) };
    m = text.match(/(\d+)\s*x/i);
    if (m)
      return { unit: "unit", packSize: Number(m[1]) };
    m = text.match(/(\d+)\s*kg/i);
    if (m)
      return { unit: "kg", packSize: Number(m[1]) };
    m = text.match(/(\d+)\s*g/i);
    if (m)
      return { unit: "g", packSize: Number(m[1]) };
    m = text.match(/(\d+)\s*ml/i);
    if (m)
      return { unit: "ml", packSize: Number(m[1]) };
    m = text.match(/(\d+)\s*l/i);
    if (m)
      return { unit: "l", packSize: Number(m[1]) };
    return void 0;
  }
  function inferVatFlag(text) {
    if (/incl/i.test(text) && /vat|tax/i.test(text))
      return "incl";
    if (/excl/i.test(text) && /vat|tax/i.test(text))
      return "excl";
    return "unknown";
  }
  function normalize(raw, source) {
    const priceDisplay = parsePrice(raw.priceText);
    const currency = raw.currencyText || parseCurrencySymbol(raw.priceText) || void 0;
    const packInfo = raw.packText ? parsePack(raw.packText) : void 0;
    const pricePerUnit = packInfo ? +(priceDisplay / packInfo.packSize).toFixed(2) : void 0;
    const vatFlag = inferVatFlag(raw.priceText + " " + (raw.packText || "") + " " + (raw.contextText || ""));
    return {
      url: raw.url,
      source,
      priceDisplay,
      currency,
      pack: raw.packText,
      unit: packInfo?.unit,
      packSize: packInfo?.packSize,
      pricePerUnit,
      vatFlag,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    };
  }

  // content/vendor-capture.ts
  var log = (...args) => console.log((/* @__PURE__ */ new Date()).toISOString(), "[cs]", ...args);
  var s = document.createElement("script");
  s.src = chrome.runtime.getURL("content/inject-fetch-hook.js");
  (document.documentElement || document.head).appendChild(s);
  s.remove();
  var networkBodies = [];
  var sent = false;
  window.addEventListener("message", (e) => {
    const data = e.data;
    if (data && data.__KPS && data.type === "NETWORK_JSON") {
      log("network", data.body);
      networkBodies.push(data.body);
      tryNetwork();
    }
  });
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "BEGIN_CAPTURE" /* BEGIN_CAPTURE */) {
      log("begin");
      tryNetwork();
      setTimeout(() => !sent && tryDom(), 800);
      setTimeout(() => window.scrollBy(0, 100), 100);
    }
  });
  function tryNetwork() {
    if (sent)
      return;
    for (const body of networkBodies) {
      const candidate = extractPrice(body);
      if (candidate) {
        const payload = normalize({ priceText: String(candidate.price), currencyText: candidate.currency, url: location.href }, "network");
        send(payload);
        break;
      }
    }
  }
  function tryDom() {
    if (sent)
      return;
    const raw = pickPrice(document);
    if (raw) {
      const payload = normalize({ ...raw, url: location.href }, "dom");
      send(payload);
    }
  }
  function extractPrice(body) {
    let found = null;
    function walk(obj) {
      if (found || !obj || typeof obj !== "object")
        return;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "number" && /price|amount|value|net|gross/i.test(k)) {
          found = { price: v };
        } else if (typeof v === "string" && /currency/i.test(k)) {
          if (found)
            found.currency = v;
          else
            found = { price: NaN, currency: v };
        } else if (typeof v === "object") {
          walk(v);
        }
      }
    }
    walk(body);
    if (found && !isNaN(found.price))
      return found;
    return null;
  }
  function send(payload) {
    if (sent)
      return;
    sent = true;
    log("send", payload);
    chrome.runtime.sendMessage({ type: "CAPTURE_RESULT" /* CAPTURE_RESULT */, payload });
  }
})();
