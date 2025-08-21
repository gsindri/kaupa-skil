import { pickPrice } from '../lib/selector-library';
import { normalize } from '../lib/price-normalizer';
import { MsgType } from '../lib/messaging';
import type { PricePayload } from '../types';

const log = (...args: any[]) => console.log(new Date().toISOString(), '[cs]', ...args);

// Inject page-context fetch/XHR hook
const s = document.createElement('script');
s.src = chrome.runtime.getURL('content/inject-fetch-hook.js');
(document.documentElement || document.head).appendChild(s);
s.remove();

const networkBodies: any[] = [];
let sent = false;

window.addEventListener('message', e => {
  const data = e.data;
  if (data && data.__KPS && data.type === 'NETWORK_JSON') {
    log('network', data.body);
    networkBodies.push(data.body);
    tryNetwork();
  }
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === MsgType.BEGIN_CAPTURE) {
    log('begin');
    tryNetwork();
    setTimeout(() => !sent && tryDom(), 800);
    setTimeout(() => window.scrollBy(0, 100), 100);
  }
});

function tryNetwork() {
  if (sent) return;
  for (const body of networkBodies) {
    const candidate = extractPrice(body);
    if (candidate) {
      const payload = normalize({ priceText: String(candidate.price), currencyText: candidate.currency, url: location.href }, 'network');
      send(payload);
      break;
    }
  }
}

function tryDom() {
  if (sent) return;
  const raw = pickPrice(document);
  if (raw) {
    const payload = normalize({ ...raw, url: location.href }, 'dom');
    send(payload);
  }
}

function extractPrice(body: any): { price: number; currency?: string } | null {
  let found: { price: number; currency?: string } | null = null;
  function walk(obj: any) {
    if (found || !obj || typeof obj !== 'object') return;
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
  log('send', payload);
  chrome.runtime.sendMessage({ type: MsgType.CAPTURE_RESULT, payload });
}

