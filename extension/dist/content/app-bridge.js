// content/app-bridge.ts
window.__KpsExtPresent = true;
window.addEventListener("message", async (e) => {
  const data = e.data;
  if (!data)
    return;
  if (data.type === "KPS_BG") {
    const result = await chrome.runtime.sendMessage(data.payload);
    window.postMessage({ type: "KPS_BG_RESULT", result }, "*");
  }
  if (data.type === "KPS_REQUEST_ORIGIN") {
    const granted = await chrome.permissions.request({ origins: [data.origin + "/*"] });
    window.postMessage({ type: "KPS_PERMISSION_RESULT", granted }, "*");
  }
});
