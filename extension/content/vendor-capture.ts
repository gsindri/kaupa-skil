import { pickPrice } from '../lib/selector-library';
import { normalize } from '../lib/price-normalizer';
import { MsgType } from '../lib/messaging';
import type { PricePayload } from '../types';

const networkBodies: any[] = [];
let captureRequested = false;
let sent = false;

function injectHook() {
  const src = chrome.runtime.getURL('content/inject-fetch-hook.js');
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  (document.head || document.documentElement).prepend(script);
}

injectHook();

window.addEventListener('message', e => {
  const data = e.data;
  if (data && data.__KPS && data.type === 'NETWORK_JSON') {
    networkBodies.push(data.body);
    if (captureRequested) tryNetwork();
  }
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === MsgType.BEGIN_CAPTURE) {
    captureRequested = true;
    tryNetwork();
    setTimeout(() => {
      if (!sent) tryDom();
    }, 800);
    setTimeout(() => {
      window.scrollBy(0, 100);
    }, 100);
  }
});

function tryNetwork() {
  if (sent) return;
  for (const body of networkBodies) {
    const candidate = extractPrice(body);
    if (candidate) {
      const payload = normalize({ priceText: String(candidate.price), currencyText: candidate.currency }, 'network', location.href);
      send(payload);
      break;
    }
  }
}

function tryDom() {
  if (sent) return;
  const raw = pickPrice(document);
  if (raw) {
    const payload = normalize(raw, 'dom', location.href);
    send(payload);
  }
}

function extractPrice(body: any): { price: number; currency?: string } | null {
  let found: { price: number; currency?: string } | null = null;
  function walk(obj: any) {
    if (found) return;
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && /price|amount|value|net|gross/i.test(k)) {
        found = { price: v };
      } else if (typeof v === 'string' && /currency/i.test(k)) {
        if (found) found.currency = v;
        else found = { price: NaN, currency: v };
      } else if (typeof v === 'object') {
        walk(v);
      }
    }
  }
  walk(body);
  if (found && !isNaN(found.price)) return found;
  return null;
}

function send(payload: PricePayload) {
  if (sent) return;
  sent = true;
  chrome.runtime.sendMessage({ type: MsgType.CAPTURE_RESULT, payload });
}
