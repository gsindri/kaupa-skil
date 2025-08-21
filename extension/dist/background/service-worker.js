// background/service-worker.ts
var version = chrome.runtime.getManifest().version;
function log(scope, ...args) {
  console.log((/* @__PURE__ */ new Date()).toISOString(), `[${scope}]`, ...args);
}
function checkErr(scope) {
  const err = chrome.runtime.lastError;
  if (err)
    log("bg", scope, err.message);
}
chrome.runtime.onInstalled.addListener((details) => {
  log("bg", "onInstalled", details.reason);
  chrome.contextMenus.create(
    { id: "kps.sync", title: "Sync price (diagnostic)", contexts: ["all"] },
    () => checkErr("contextMenus.create")
  );
});
chrome.runtime.onStartup.addListener(() => log("bg", "onStartup"));
chrome.action.onClicked.addListener(() => runSyncOnActiveTab());
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "kps.sync")
    runSync(tab?.url, tab?.id).catch((err) => log("bg", "sync err", err));
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg?.type)
    return;
  log("bg", "onMessage", msg.type);
  switch (msg.type) {
    case "PING" /* PING */:
      sendResponse({ ok: true, where: "bg", version });
      break;
    case "REQUEST_ORIGIN_PERMISSION" /* REQUEST_ORIGIN_PERMISSION */:
      ensureOriginPermission(msg.origin).then((granted) => sendResponse({ granted })).catch((err) => sendResponse({ granted: false, error: String(err) }));
      return true;
    case "SYNC_PRICE" /* SYNC_PRICE */:
      runSync(msg.url, sender.tab?.id).then((payload) => sendResponse({ payload })).catch((err) => sendResponse({ error: String(err) }));
      return true;
  }
});
async function runSyncOnActiveTab() {
  await runSync();
}
async function runSync(url, tabId) {
  let createdId;
  let targetUrl = url;
  if (!tabId) {
    if (url) {
      try {
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id;
        createdId = tabId;
      } catch (e) {
        log("bg", "tabs.create", e);
        return null;
      }
    } else {
      const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!t?.id || !t.url) {
        log("bg", "no active tab");
        return null;
      }
      tabId = t.id;
      targetUrl = t.url;
    }
  } else if (!targetUrl) {
    const tab = await chrome.tabs.get(tabId);
    targetUrl = tab.url || void 0;
  }
  if (!tabId || !targetUrl)
    return null;
  const origin = new URL(targetUrl).origin;
  if (!await ensureOriginPermission(origin)) {
    log("bg", "permission denied", origin);
    if (createdId)
      await chrome.tabs.remove(createdId);
    return null;
  }
  await waitForTabComplete(tabId);
  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/inject-fetch-hook.js"],
      world: "MAIN"
    });
    if (!injectionResults || injectionResults.length === 0) {
      log("bg", "executeScript", "Script injection failed or injected into no frames");
      if (createdId)
        await chrome.tabs.remove(createdId);
      return null;
    }
  } catch (e) {
    log("bg", "executeScript", e);
    if (createdId)
      await chrome.tabs.remove(createdId);
    return null;
  }
  chrome.tabs.sendMessage(tabId, { type: "BEGIN_CAPTURE" /* BEGIN_CAPTURE */ }, void 0, () => checkErr("tabs.sendMessage"));
  let payload = null;
  try {
    payload = await waitForCapture(tabId, 1e4);
    await chrome.storage.local.set({ [`recent:${origin}`]: payload });
    checkErr("storage.set");
  } catch (e) {
    log("bg", "capture error", e);
  }
  if (createdId) {
    await chrome.tabs.remove(createdId).catch((err) => log("bg", "tabs.remove", err));
  }
  return payload;
}
function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
function waitForCapture(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(handler);
      reject(new Error("timeout"));
    }, timeoutMs);
    function handler(msg, sender) {
      if (msg.type === "CAPTURE_RESULT" /* CAPTURE_RESULT */ && sender.tab?.id === tabId) {
        clearTimeout(timer);
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg.payload);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}
async function ensureOriginPermission(origin) {
  const perm = { origins: [origin + "/*"] };
  const has = await chrome.permissions.contains(perm);
  if (has)
    return true;
  const granted = await chrome.permissions.request(perm);
  return granted;
}
