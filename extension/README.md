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
