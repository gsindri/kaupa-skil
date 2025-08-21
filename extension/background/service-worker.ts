import { MsgType } from '../lib/messaging';
import type { PricePayload } from '../types';

const version = chrome.runtime.getManifest().version;

function log(scope: string, ...args: any[]) {
  console.log(new Date().toISOString(), `[${scope}]`, ...args);
}

function checkErr(scope: string) {
  const err = chrome.runtime.lastError;
  if (err) log('bg', scope, err.message);
}

chrome.runtime.onInstalled.addListener(details => {
  log('bg', 'onInstalled', details.reason);
  chrome.contextMenus.create(
    { id: 'kps.sync', title: 'Sync price (diagnostic)', contexts: ['all'] },
    () => checkErr('contextMenus.create')
  );
});

chrome.runtime.onStartup.addListener(() => log('bg', 'onStartup'));

chrome.action.onClicked.addListener(() => runSyncOnActiveTab());

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'kps.sync') runSync(tab?.url, tab?.id).catch(err => log('bg', 'sync err', err));
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg?.type) return;
  log('bg', 'onMessage', msg.type);
  switch (msg.type) {
    case MsgType.PING:
      sendResponse({ ok: true, where: 'bg', version });
      break;
    case MsgType.REQUEST_ORIGIN_PERMISSION:
      ensureOriginPermission(msg.origin)
        .then(granted => sendResponse({ granted }))
        .catch(err => sendResponse({ granted: false, error: String(err) }));
      return true;
    case MsgType.SYNC_PRICE:
      runSync(msg.url, sender.tab?.id)
        .then(payload => sendResponse({ payload }))
        .catch(err => sendResponse({ error: String(err) }));
      return true;
  }
});

async function runSyncOnActiveTab() {
  await runSync();
}

async function runSync(url?: string, tabId?: number): Promise<PricePayload | null> {
  let createdId: number | undefined;
  let targetUrl = url;

  if (!tabId) {
    if (url) {
      try {
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id!;
        createdId = tabId;
      } catch (e) {
        log('bg', 'tabs.create', e);
        return null;
      }
    } else {
      const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!t?.id || !t.url) {
        log('bg', 'no active tab');
        return null;
      }
      tabId = t.id;
      targetUrl = t.url;
    }
  } else if (!targetUrl) {
    const tab = await chrome.tabs.get(tabId);
    targetUrl = tab.url || undefined;
  }

  if (!tabId || !targetUrl) return null;
  const origin = new URL(targetUrl).origin;
  if (!(await ensureOriginPermission(origin))) {
    log('bg', 'permission denied', origin);
    if (createdId) await chrome.tabs.remove(createdId);
    return null;
  }

  await waitForTabComplete(tabId);

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/inject-fetch-hook.js'], world: 'MAIN' });
  } catch (e) {
    log('bg', 'executeScript', e);
  }

  chrome.tabs.sendMessage(tabId, { type: MsgType.BEGIN_CAPTURE }, undefined, () => checkErr('tabs.sendMessage'));

  let payload: PricePayload | null = null;
  try {
    payload = await waitForCapture(tabId, 10000);
    await chrome.storage.local.set({ [`recent:${origin}`]: payload });
    checkErr('storage.set');
  } catch (e) {
    log('bg', 'capture error', e);
  }

  if (createdId) {
    await chrome.tabs.remove(createdId).catch(err => log('bg', 'tabs.remove', err));
  }

  return payload;
}

function waitForTabComplete(tabId: number): Promise<void> {
  return new Promise(resolve => {
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function waitForCapture(tabId: number, timeoutMs: number): Promise<PricePayload> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(handler);
      reject(new Error('timeout'));
    }, timeoutMs);

    function handler(msg: any, sender: chrome.runtime.MessageSender) {
      if (msg.type === MsgType.CAPTURE_RESULT && sender.tab?.id === tabId) {
        clearTimeout(timer);
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg.payload as PricePayload);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}

async function ensureOriginPermission(origin: string): Promise<boolean> {
  const perm = { origins: [origin + '/*'] };
  const has = await chrome.permissions.contains(perm);
  if (has) return true;
  const granted = await chrome.permissions.request(perm);
  return granted;
}

export {}; // keep file a module

