// background/service-worker.ts
console.log("kps:init", chrome.runtime.getManifest().version);
var pendingCaptures = /* @__PURE__ */ new Map();
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sync-price",
    title: "Sync price (this page)",
    contexts: ["page"]
  });
});
chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url) {
    syncPrice(tab.id, tab.url).catch((err) => console.warn(err));
  }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sync-price" && tab?.id && tab.url) {
    syncPrice(tab.id, tab.url).catch((err) => console.warn(err));
  }
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "PING" /* PING */:
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      break;
    case "REQUEST_ORIGIN_PERMISSION" /* REQUEST_ORIGIN_PERMISSION */:
      ensureOriginPermission(msg.origin).then((granted) => sendResponse({ granted }));
      return true;
    case "SYNC_PRICE" /* SYNC_PRICE */: {
      const url = msg.url;
      if (url) {
        syncPrice(void 0, url).then((payload) => sendResponse({ payload }));
      } else {
        const tabId = sender.tab?.id;
        if (tabId && sender.tab?.url) {
          syncPrice(tabId, sender.tab.url).then((payload) => sendResponse({ payload }));
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            const t = tabs[0];
            if (t.id && t.url) {
              syncPrice(t.id, t.url).then((payload) => sendResponse({ payload }));
            }
          });
        }
      }
      return true;
    }
    case "CAPTURE_RESULT" /* CAPTURE_RESULT */:
      if (sender.tab?.id) {
        const cb = pendingCaptures.get(sender.tab.id);
        if (cb)
          cb(msg.payload);
      }
      break;
  }
});
async function ensureOriginPermission(origin) {
  const perm = { origins: [origin + "/*"] };
  const has = await chrome.permissions.contains(perm);
  if (has)
    return true;
  const granted = await chrome.permissions.request(perm);
  console.log("kps:perm:" + (granted ? "granted" : "denied"), origin);
  return granted;
}
async function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}
function waitForCapture(tabId, timeoutMs = 1e4) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingCaptures.delete(tabId);
      reject(new Error("timeout"));
    }, timeoutMs);
    pendingCaptures.set(tabId, (payload) => {
      clearTimeout(timeout);
      pendingCaptures.delete(tabId);
      resolve(payload);
    });
  });
}
async function syncPrice(tabId, url) {
  const start = performance.now();
  let createdTabId;
  let targetUrl = url;
  if (!tabId && url) {
    const tab2 = await chrome.tabs.create({ url, active: false });
    tabId = tab2.id;
    createdTabId = tabId;
  }
  if (!tabId)
    return null;
  const tab = await chrome.tabs.get(tabId);
  targetUrl = targetUrl || tab.url || "";
  const origin = new URL(targetUrl).origin;
  if (!await ensureOriginPermission(origin)) {
    console.warn("kps:perm:denied", origin);
    if (createdTabId)
      await chrome.tabs.remove(createdTabId);
    return null;
  }
  await waitForTabComplete(tabId);
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content/vendor-capture.js"] });
  } catch (e) {
    console.warn("executeScript failed", e);
  }
  chrome.tabs.sendMessage(tabId, { type: "BEGIN_CAPTURE" /* BEGIN_CAPTURE */ });
  try {
    const payload = await waitForCapture(tabId, 1e4);
    console.log("kps:capture:success", payload.source);
    await chrome.storage.local.set({ ["recent:" + origin]: payload });
    return payload;
  } catch (e) {
    console.warn("kps:capture:timeout");
    return null;
  } finally {
    if (createdTabId)
      chrome.tabs.remove(createdTabId);
    console.log("kps:capture:done", Math.round(performance.now() - start));
  }
}
self.addEventListener("message", (evt) => {
  if (evt.data === "test-sync") {
    chrome.runtime.sendMessage({ type: "SYNC_PRICE" /* SYNC_PRICE */ });
  }
});
