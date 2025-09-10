# Top Bar Manifest

- **src/components/layout/AppChrome.tsx** – renders the decorative chrome gradient behind the header; height clamped and layered below the header.
- **src/components/layout/TopNavigation.tsx** – main header navigation; sets z-index above chrome and clamps height.
- **src/styles/layout-vars.css** – global layout tokens including clamped `--chrome-h` and z-index variables.
- **src/index.css** – global styles establishing `--header-h`, clamped `--chrome-h`, and removing the `#catalogHeader` pseudo-element overlay.

Known quirk: `--header-h` is updated via JavaScript to match measured header height.
