# Top Bar Manifest

- **src/components/layout/AppChrome.tsx** – renders the decorative chrome gradient behind the header; height follows `--toolbar-h`.
- **src/components/layout/TopNavigation.tsx** – main header navigation; measures itself to set `--toolbar-h` and sits above chrome.
- **src/styles/layout-vars.css** – global layout tokens including `--toolbar-h` and z-index variables.
- **src/index.css** – global styles establishing `--header-h`, mapping `--hdr-p` to a translate, and removing the `#catalogHeader` pseudo-element overlay.

Known quirk: `--header-h` is updated via JavaScript to match measured header height.
