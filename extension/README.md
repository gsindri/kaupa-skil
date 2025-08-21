# EXT_NAME

Chrome MV3 extension that synchronizes product prices from vendor pages.

## Build

From repository root:

```bash
npm --prefix extension install
npm --prefix extension run build
```

This bundles TypeScript into `dist/` and copies the manifest and icons.

## Load for testing

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the `extension/dist` directory.
4. Navigate to a product page and click the toolbar icon or use the context menu.
5. Check the service worker console for logs and the captured `PricePayload`.

## Manual background test

In the service worker console:

```js
chrome.runtime.sendMessage({ type: 'SYNC_PRICE' })
```

The result is printed and stored in `chrome.storage.local` under `recent:<origin>`.

## Troubleshooting Checklist

- Manifest path correct? `background/service-worker.js` exists in `dist` and matches the manifest path.
- ESM vs non-ESM mismatch? If the service worker uses `type:"module"`, bundle it as ESM; otherwise remove the type or change the bundler format.
- No events → service worker stays Inactive: ensure listeners for `onInstalled`, `onMessage`, `action.onClicked`, or `contextMenus.onClicked` exist. Click the action to wake the worker.
- `sendResponse` lost? Return `true` from the listener for async replies.
- Content scripts injected? Check URL match patterns and `run_at` timings.
- `web_accessible_resources`: ensure `content/inject-fetch-hook.js` is listed.
- Optional host permissions: request/obtain the vendor origin before scripting the tab.
- CSP blocks inject? The DOM fallback should still run; log CSP hints.
- Inspect service worker logs via `chrome://extensions` → **Service worker** link.

## How to test

1. Run `npm --prefix extension run build`.
2. Load the unpacked `extension/dist` directory in Chrome.
3. Open the extension options page (Diagnostics) and click **Ping SW** – expect the service worker version.
4. Navigate to a simple product page.
5. Click **Sync Current Tab** on the diagnostics page.
6. A `PricePayload` should appear and a `recent:<origin>` entry should be written to storage.
