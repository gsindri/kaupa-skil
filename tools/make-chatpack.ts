// tools/make-chatpack.ts
import fg from 'fast-glob'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Usage (examples):
 *   pnpm dlx tsx tools/make-chatpack.ts --preset suppliers
 *   pnpm dlx tsx tools/make-chatpack.ts --preset topbar
 *   pnpm dlx tsx tools/make-chatpack.ts --preset sidebar
 *   pnpm dlx tsx tools/make-chatpack.ts --preset cart
 *   pnpm dlx tsx tools/make-chatpack.ts --preset catalog
 *
 * Optional flags:
 *   --keep 2   # keep the last 2 old packs for this preset (default 0 = delete all old)
 *
 * (optional) package.json scripts:
 *   "chat:pack:suppliers": "tsx tools/make-chatpack.ts --preset suppliers",
 *   "chat:pack:topbar":    "tsx tools/make-chatpack.ts --preset topbar",
 *   "chat:pack:sidebar":   "tsx tools/make-chatpack.ts --preset sidebar",
 *   "chat:pack:cart":      "tsx tools/make-chatpack.ts --preset cart",
 *   "chat:pack:catalog":   "tsx tools/make-chatpack.ts --preset catalog"
 */

type PresetConfig = {
  /** explicit file names or paths to include (exact path first, else basename search) */
  requested?: string[]
  /** glob patterns to include (to catch moved/renamed helpers) */
  patterns?: string[]
}

const PRESETS: Record<string, PresetConfig> = {
  // ——————————————————————————————————————————————————————————
  // SUPPLIERS
  // ——————————————————————————————————————————————————————————
  suppliers: {
    requested: [
      // Key pages & routing
      'src/pages/Suppliers.tsx',
      'src/router.tsx',
      'src/router.test.ts',

      // Supplier components (core)
      'src/components/suppliers/EnhancedSupplierManagement.tsx',
      'src/components/suppliers/SupplierManagement.tsx',
      'src/components/suppliers/SupplierList.tsx',
      'src/components/suppliers/SupplierCredentialsForm.tsx',
      'src/components/suppliers/IngestionRunsList.tsx',
      'src/components/suppliers/BookmarkletSync.tsx',
      'src/components/suppliers/SupplierItemsWithHarInfo.tsx',
      'src/components/suppliers/HarUploadModal.tsx',
      'src/components/suppliers/HarSyncStatus.tsx',
      'src/components/suppliers/HarAnalyticsPreview.tsx',
      'src/components/suppliers/HarProcessingPreview.tsx',

      // Docs
      'docs/CONNECTORS.md',

      // Ingestion entry points commonly referenced in prompts
      'ingestion/pipelines/innnes-upsert.ts',
      'ingestion/runner.ts',
      'ingestion/types.ts',

      // Seeds & scripts
      'scripts/seedCatalog.ts',
      'supabase/scripts/seedCatalog.js',
      'supabase/seed/dev_seed.sql',
    ],
    patterns: [
      // Components referencing supplier data outside suppliers/
      'src/components/catalog/*Supplier*.tsx',
      'src/components/catalog/**/__tests__/*Supplier*.test.tsx',
      'src/components/catalog/Supplier*.tsx',
      'src/components/catalog/CatalogTable.tsx',
      'src/components/catalog/CatalogTable.test.tsx',
      'src/components/catalog/CatalogFiltersPanel.tsx',
      'src/components/catalog/FacetPanel.tsx',

      'src/components/cart/**/*.{ts,tsx}',
      'src/components/compare/**/*.{ts,tsx}',
      'src/components/dashboard/**/*{Supplier*,Connector*,Anomaly*,Health*}.{ts,tsx}',
      'src/components/orders/**/*{Supplier*,Order*}.{ts,tsx}',
      'src/components/onboarding/steps/*Supplier*.tsx',
      'src/components/search/*{HeaderSearch,SearchResultsPopover,SearchInput}*.tsx',

      // Hooks, contexts, services, state, lib, utils
      'src/contexts/**/BasketProvider.tsx',
      'src/contexts/**/BasketProvider.test.tsx',
      'src/hooks/**/useSupplier*.ts*',
      'src/hooks/**/useEnhancedSupplier*.ts*',
      'src/hooks/**/useOptimizedSupplier*.ts*',
      'src/hooks/**/useDeliveryAnalytics.tsx',
      'src/hooks/**/useOrderingSuggestions.tsx',
      'src/services/**/{DeliveryCalculator,DeliveryRules,OrderingSuggestions}.ts',
      'src/services/**/{DeliveryCalculator,OrderingSuggestions}.test.ts',
      'src/state/{catalogFiltersStore,userPrefs}.ts*',
      'src/lib/{catalogFilters,catalogState,queryKeys,landedCost,normalization}.ts',
      'src/utils/{harAnalytics,harDataExtractor,harRecommendations}.ts',

      // Ingestion adapters/extractors
      'ingestion/extractors/innnes-cheerio.ts',
      'ingestion/adapters/**/*.{ts,tsx}',
      'ingestion/adapters/{csv-bar.ts,sitemap-baz.ts,api-foo.ts}',

      // E2E tests
      'e2e/navigation.spec.ts',
      'e2e/header-stability.spec.ts',

      // Supabase Edge Functions
      'supabase/functions/{ingest-supplier,ingest-supplier-products,match-supplier-item,schedule-supplier-ingestion,job-processor,ingest_har,stale-sweep}/**/*.{ts,tsx,js,json}',
      'supabase/functions/ingest-supplier/availability.test.ts',

      // Supabase migrations (many supplier-related)
      'supabase/migrations/**/*supplier*.sql',
      'supabase/migrations/**/*ingest*.sql',
      'supabase/migrations/**/*supplier*_*.sql',

      // Docs with supplier mentions
      'docs/**/{README,SECURITY,hardcode-inventory,dashboard-pantry-mock-inventory,duplication-audit}.md',

      // Top-level refs
      'package.json',
      'README.md',
      'AUDIT/**/*',
      'tools/make-chatpack.ts',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // CATALOG
  // ——————————————————————————————————————————————————————————
  catalog: {
    requested: [
      // Page entry & state
      'src/pages/catalog/CatalogPage.tsx',
      'src/pages/catalog/useCatalogState.ts',
      'src/pages/catalog/ZeroResultsRescue.tsx',
      'src/pages/catalog/CatalogPage.test.tsx',

      // Supporting layout/UI pieces explicitly called out
      'src/components/layout/CatalogLayout.tsx',
      'src/components/ui/filter-chip.tsx',
      'src/components/ui/tri-state-chip.tsx',
      'src/components/ui/tri-state-chip.test.tsx',
      'src/components/search/HeroSearchInput.tsx',
      'src/components/common/InfiniteSentinel.tsx',
      'src/components/place-order/ViewToggle.tsx',

      // Hooks & state
      'src/hooks/useCatalogProducts.ts',
      'src/hooks/useOrgCatalog.ts',
      'src/hooks/useCatalogSearchSuggestions.ts',
      'src/state/catalogFiltersStore.ts',
      'src/state/catalogFiltersStore.test.ts',

      // Lib modules
      'src/lib/catalogFilters.ts',
      'src/lib/catalogState.ts',
      'src/lib/scrollMemory.ts',
      'src/lib/analytics.ts',
      'src/lib/images.ts',

      // Service layer
      'src/services/catalog.ts',
      'src/services/__tests__/Catalog.test.ts',
    ],
    patterns: [
      // Catalog components
      'src/components/catalog/**/*.{ts,tsx,css}',
      'src/components/catalog/**/__tests__/**/*.{ts,tsx}',

      // Page dir
      'src/pages/catalog/**/*.{ts,tsx,css}',

      // Hooks & lib (catch moved/renamed)
      'src/hooks/**/useCatalog*.ts*',
      'src/hooks/**/useOrgCatalog*.ts*',
      'src/lib/**/catalog*.ts*',

      // Shared helpers that catalog uses
      'src/components/ui/{filter-chip,tri-state-chip}.ts*',
      'src/components/common/InfiniteSentinel.tsx',
      'src/components/place-order/ViewToggle.tsx',

      // Virtualization
      'src/components/catalog/VirtualizedGrid.tsx',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // SIDEBAR
  // ——————————————————————————————————————————————————————————
  sidebar: {
    requested: [
      // Core UI building blocks
      'src/components/ui/sidebar.tsx',
      'src/components/ui/sidebar-provider.tsx',
      'src/components/ui/use-sidebar.ts',
      'src/components/ui/sidebar-constants.ts',

      // Layout / specialized sidebars
      'src/components/layout/EnhancedAppSidebar.tsx',
      'src/components/quick/SmartCartSidebar.tsx',

      // Styling & configuration
      'src/index.css',
      'src/styles/design-system.css',
      'src/styles/globals.css',
      'src/styles/layout-vars.css',
      'tailwind.config.ts',

      // Tests / routing
      'e2e/navigation.spec.ts',
      'src/router.test.ts',

      // Tooling
      'tools/make-chatpack.ts',
      'package.json',
    ],
    patterns: [
      // Any sidebar-related UI files
      'src/components/ui/*sidebar*.{ts,tsx}',
      'src/components/ui/sidebar*.{ts,tsx}',
      'src/components/layout/*Sidebar*.tsx',
      'src/components/quick/*Sidebar*.tsx',

      // Styles affecting sidebar layout/tokens
      'src/styles/*{design-system,globals,layout-vars}*.css',
      'src/**/*.css',

      // Navigation tests & router
      'e2e/**/navigation.spec.ts',
      'src/**/router*.{ts,tsx,test.tsx}',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // CART (kept minimal; updated to common current filenames)
  // ——————————————————————————————————————————————————————————
  cart: {
    requested: [
      'src/contexts/BasketProvider.tsx',
      'src/hooks/useBasket.ts',
      'src/components/cart/AddToCartButton.tsx',
      'src/components/cart/CartDrawer.tsx',
      'src/components/cart/QuantityStepper.tsx',
      'src/components/cart/flyToCart.ts',
      'src/components/orders/OrderComposer.tsx',
      'src/hooks/useOrderingSuggestions.tsx',
      'src/hooks/useDeliveryOptimization.tsx',
      'src/services/DeliveryCalculator.ts',
      'src/index.css',
    ],
    patterns: [
      'src/components/cart/**/*.{ts,tsx}',
      'src/components/orders/**/*{Order*,Composer*}.{ts,tsx}',
      'src/hooks/**/use*Cart*.ts*',
      'src/hooks/**/useOrderingSuggestions.tsx',
      'src/hooks/**/useDeliveryOptimization.tsx',
      'src/services/**/DeliveryCalculator.ts',
    ],
  },

  // ——————————————————————————————————————————————————————————
  // TOP BAR / HEADER
  // ——————————————————————————————————————————————————————————
  topbar: {
    requested: [
      // Docs / manifest
      'TOPBAR_MANIFEST.md',

      // Core components
      'src/components/layout/TopNavigation.tsx',
      'src/components/layout/AppChrome.tsx',
      'src/components/layout/AppLayout.tsx',
      'src/components/layout/FullWidthLayout.tsx',
      'src/components/layout/ElevationBanner.tsx',

      // Switchers & search
      'src/components/layout/TenantSwitcher.tsx',
      'src/components/layout/LanguageSwitcher.tsx',
      'src/components/search/HeaderSearch.tsx',

      // Scroll-hide behavior (+test)
      'src/components/layout/useHeaderScrollHide.ts',
      'src/components/layout/useHeaderScrollHide.test.tsx',

      // Styling / globals
      'src/styles/layout-vars.css',
      'src/styles/globals.css',
      'src/index.css',
    ],
    patterns: [
      'src/components/layout/*{TopNavigation,AppChrome,AppLayout,FullWidthLayout,ElevationBanner}*.tsx',
      'src/components/layout/*Header*.ts*',
      'src/components/search/*HeaderSearch*.tsx',
      'src/styles/*{layout-vars,globals}*.css',
      'src/**/*catalogHeader*', // catch/remove legacy overlay refs if still present
    ],
  },
}

// folders to ignore while searching
const IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.chatpack/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.vercel/**',
]

// when multiple files share a basename, prefer these roots
const PREFER = [
  'src/pages/**',
  'src/components/layout/**',
  'src/components/ui/**',
  'src/components/quick/**',
  'src/components/**',
  'src/contexts/**',
  'src/hooks/**',
  'src/layout/**',
  'src/services/**',
  'src/lib/**',
  'src/styles/**',
  'components/**',
  'pages/**',
  'app/**',
  'styles/**',
  '**', // fallback
]

function parseArg(name: string, fallback?: string) {
  const i = process.argv.findIndex(a => a === `--${name}`)
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1]
  return fallback
}

function langFor(p: string) {
  const lower = p.toLowerCase()
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.tsx')) return 'tsx'
  if (lower.endsWith('.ts')) return 'ts'
  if (lower.endsWith('.js')) return 'js'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.sql')) return 'sql'
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'md'
  return ''
}

async function exists(p: string) {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

function rank(p: string): number {
  const norm = p.replace(/\\/g, '/')
  for (let i = 0; i < PREFER.length; i++) {
    const pat = PREFER[i].replace('/**', '')
    if (norm.includes(pat.replace('**', ''))) return i
  }
  return 999
}

async function findByRequested(request: string): Promise<string[]> {
  // 1) exact hit
  if (await exists(request)) return [path.normalize(request)]

  // 2) basename search
  const base = path.basename(request)
  if (!base) return []
  const matches = await fg([`**/${base}`], { ignore: IGNORE, dot: false })
  if (matches.length === 0) return []

  const sorted = matches.sort((a, b) => rank(a) - rank(b))
  const seen = new Set<string>()
  const uniq: string[] = []
  for (const m of sorted) {
    const abs = path.normalize(m)
    if (!seen.has(abs)) {
      seen.add(abs)
      uniq.push(abs)
    }
  }
  return uniq
}

async function collectFiles(preset: PresetConfig): Promise<string[]> {
  const files: string[] = []

  if (preset.patterns && preset.patterns.length) {
    const patFiles = await fg(preset.patterns, { ignore: IGNORE, dot: false })
    files.push(...patFiles.map(p => path.normalize(p)))
  }

  if (preset.requested && preset.requested.length) {
    for (const req of preset.requested) {
      const found = await findByRequested(req)
      if (found.length === 0) {
        console.warn('⚠️  Not found:', req)
        continue
      }
      files.push(...found)
    }
  }

  // de-dup + sort
  return Array.from(new Set(files)).sort((a, b) => a.localeCompare(b))
}

function timestamp() {
  // YYYYMMDDHHMM (windows-safe)
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
}

async function cleanOldPacks(outDir: string, presetName: string, keep = 0) {
  const pattern = `${outDir}/${presetName}-chatpack-*.md`
  const matches = (await fg([pattern], { dot: false })).sort()
  if (matches.length === 0) return []

  const toDelete = keep > 0 ? matches.slice(0, Math.max(0, matches.length - keep)) : matches
  await Promise.allSettled(toDelete.map(p => fs.unlink(p)))
  return toDelete
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function run() {
  const presetName = parseArg('preset', 'catalog') ?? 'catalog'
  const keepStr = parseArg('keep', '0') ?? '0'
  const keep = Math.max(0, Number.isFinite(Number(keepStr)) ? Number(keepStr) : 0)

  const cfg = PRESETS[presetName]
  if (!cfg) {
    console.error(`Unknown preset "${presetName}". Available: ${Object.keys(PRESETS).join(', ')}`)
    process.exit(1)
  }

  const files = await collectFiles(cfg)

  const outDir = '.chatpack'
  await fs.mkdir(outDir, { recursive: true })

  // delete older packs for this preset (keep N if requested)
  const deleted = await cleanOldPacks(outDir, presetName, keep)
  if (deleted.length) {
    console.log(`Deleted ${deleted.length} old pack(s) for "${presetName}".`)
  }

  const stamp = timestamp()
  const outPath = `${outDir}/${presetName}-chatpack-${stamp}.md`

  let out = `# ${capitalize(presetName)} ChatPack ${new Date().toISOString()}\n\n_Contains ${files.length} file(s)._`

  for (const p of files) {
    const code = await fs.readFile(p, 'utf8').catch(() => `/* ERROR: Could not read ${p} */`)
    const fence = langFor(p)
    out += `\n\n---\n\n## ${p}\n\n\`\`\`${fence}\n${code}\n\`\`\`\n`
  }

  await fs.writeFile(outPath, out, 'utf8')
  console.log(`Wrote ${outPath} with ${files.length} file(s)`)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
