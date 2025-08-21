"use strict";
(() => {
  // content/app-bridge.ts
  var log = (...args) => console.log((/* @__PURE__ */ new Date()).toISOString(), "[ab]", ...args);
  window.__KpsExtPresent = true;
  window.addEventListener("message", async (e) => {
    const data = e.data;
    if (!data)
      return;
    if (data.type === "KPS_BG") {
      log("relay", data.payload);
      const result = await chrome.runtime.sendMessage(data.payload).catch((err) => ({ error: String(err) }));
      window.postMessage({ type: "KPS_BG_RESULT", result }, "*");
    }
    if (data.type === "KPS_REQUEST_ORIGIN") {
      const granted = await chrome.permissions.request({ origins: [data.origin + "/*"] });
      if (chrome.runtime.lastError)
        log("perm.request", chrome.runtime.lastError.message);
      window.postMessage({ type: "KPS_PERMISSION_RESULT", granted }, "*");
    }
  });
})();
