import { MsgType } from '../lib/messaging';
import type { PricePayload } from '../types';

console.log('kps:init', chrome.runtime.getManifest().version);

const pendingCaptures = new Map<number, (payload: PricePayload) => void>();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sync-price',
    title: 'Sync price (this page)',
    contexts: ['page']
  });
});

chrome.action.onClicked.addListener(tab => {
  if (tab.id && tab.url) {
    syncPrice(tab.id, tab.url).catch(err => console.warn(err));
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sync-price' && tab?.id && tab.url) {
    syncPrice(tab.id, tab.url).catch(err => console.warn(err));
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case MsgType.PING:
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      break;
    case MsgType.REQUEST_ORIGIN_PERMISSION:
      ensureOriginPermission(msg.origin).then(granted => sendResponse({ granted }));
      return true;
    case MsgType.SYNC_PRICE: {
      const url: string | undefined = msg.url;
      if (url) {
        syncPrice(undefined, url).then(payload => sendResponse({ payload }));
      } else {
        const tabId = sender.tab?.id;
        if (tabId && sender.tab?.url) {
          syncPrice(tabId, sender.tab.url).then(payload => sendResponse({ payload }));
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            const t = tabs[0];
            if (t.id && t.url) {
              syncPrice(t.id, t.url).then(payload => sendResponse({ payload }));
            }
          });
        }
      }
      return true;
    }
    case MsgType.CAPTURE_RESULT:
      if (sender.tab?.id) {
        const cb = pendingCaptures.get(sender.tab.id);
        if (cb) cb(msg.payload as PricePayload);
      }
      break;
  }
});

async function ensureOriginPermission(origin: string): Promise<boolean> {
  const perm = { origins: [origin + '/*'] };
  const has = await chrome.permissions.contains(perm);
  if (has) return true;
  const granted = await chrome.permissions.request(perm);
  console.log('kps:perm:' + (granted ? 'granted' : 'denied'), origin);
  return granted;
}

async function waitForTabComplete(tabId: number): Promise<void> {
  return new Promise(resolve => {
    function listener(id: number, info: chrome.tabs.TabChangeInfo) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function waitForCapture(tabId: number, timeoutMs = 10000): Promise<PricePayload> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingCaptures.delete(tabId);
      reject(new Error('timeout'));
    }, timeoutMs);
    pendingCaptures.set(tabId, payload => {
      clearTimeout(timeout);
      pendingCaptures.delete(tabId);
      resolve(payload);
    });
  });
}

async function syncPrice(tabId?: number, url?: string): Promise<PricePayload | null> {
  const start = performance.now();
  let createdTabId: number | undefined;
  let targetUrl = url;
  if (!tabId && url) {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id!;
    createdTabId = tabId;
  }
  if (!tabId) return null;
  const tab = await chrome.tabs.get(tabId);
  targetUrl = targetUrl || tab.url || '';
  const origin = new URL(targetUrl).origin;
  if (!(await ensureOriginPermission(origin))) {
    console.warn('kps:perm:denied', origin);
    if (createdTabId) await chrome.tabs.remove(createdTabId);
    return null;
  }
  await waitForTabComplete(tabId);
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/vendor-capture.js'] });
  } catch (e) {
    console.warn('executeScript failed', e);
  }
  chrome.tabs.sendMessage(tabId, { type: MsgType.BEGIN_CAPTURE });
  try {
    const payload = await waitForCapture(tabId, 10000);
    console.log('kps:capture:success', payload.source);
    await chrome.storage.local.set({ ['recent:' + origin]: payload });
    return payload;
  } catch (e) {
    console.warn('kps:capture:timeout');
    return null;
  } finally {
    if (createdTabId) chrome.tabs.remove(createdTabId);
    console.log('kps:capture:done', Math.round(performance.now() - start));
  }
}

// Manual test helper
self.addEventListener('message', evt => {
  if (evt.data === 'test-sync') {
    chrome.runtime.sendMessage({ type: MsgType.SYNC_PRICE });
  }
});

