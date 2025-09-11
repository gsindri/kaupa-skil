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
  suppliers: {
    requested: [
      // Database schema
      'supabase/migrations/20250812165208_79d75377-0718-46c4-ae46-a086b1a517a6.sql',
      'supabase/migrations/20250830130000_create_supplier_connections.sql',
      'src/integrations/supabase/types.ts',

      // Supabase edge functions & ingestion pipeline
      'supabase/functions/ingest-supplier/index.ts',
      'supabase/functions/ingest-supplier-products/index.ts',
      'supabase/functions/schedule-supplier-ingestion/index.ts',
      'supabase/functions/match-supplier-item/index.ts',
      'ingestion/adapters/api-foo.ts',

      // Frontend hooks and data access
      'src/hooks/useSuppliers.tsx',
      'src/hooks/useSupplierCredentials.tsx',
      'src/hooks/useSupplierConnections.ts',
      'src/hooks/useSupplierItems.tsx',
      'src/hooks/useConnectorRuns.tsx',

      // UI components and pages
      'src/components/suppliers/EnhancedSupplierManagement.tsx',
      'src/components/suppliers/SupplierList.tsx',
      'src/components/dashboard/SuppliersPanel.tsx',
      'src/pages/Suppliers.tsx',

      // Documentation
      'docs/CONNECTORS.md',

      // Helpful fallbacks by basename
      'create_supplier_connections.sql',
      'types.ts',
      'EnhancedSupplierManagement.tsx',
      'SupplierList.tsx',
      'SuppliersPanel.tsx',
      'Suppliers.tsx',
      'CONNECTORS.md',
    ],
    patterns: [
      // DB migrations (catch renamed files)
      'supabase/migrations/**/*supplier*.sql',
      // Edge functions
      'supabase/functions/{ingest-supplier,ingest-supplier-products,schedule-supplier-ingestion,match-supplier-item}/**/*.{ts,tsx,js}',
      // Ingestion adapters
      'ingestion/adapters/**/*.{ts,tsx}',
      // Hooks
      'src/hooks/**/useSupplier*.ts*',
      'src/hooks/**/useConnectorRuns.ts*',
      // Components/pages
      'src/components/**/suppliers/**/*.tsx',
      'src/components/**/Supplier*.tsx',
      'src/components/dashboard/*Supplier*.tsx',
      'src/pages/**/Suppliers.tsx',
      // Docs
      'docs/**/CONNECTORS.md',
    ],
  },

  catalog: {
    patterns: [
      'src/pages/catalog/**/*.{ts,tsx,css}',
      'src/pages/**/Catalog*.tsx',
      'src/components/**/{Catalog*,ProductCard*,ProductThumb*,AvailabilityBadge*,Supplier*,Facet*,SortDropdown*}.{ts,tsx}',
      'src/hooks/**/useCatalog*.ts*',
      'src/hooks/**/useOrgCatalog*.ts*',
      'src/lib/**/catalog*.ts*',
    ],
  },

  sidebar: {
    requested: [
      '/mnt/data/sidebar.tsx',
      '/mnt/data/sidebar-provider.tsx',
      '/mnt/data/use-sidebar.ts',
      '/mnt/data/sidebar-constants.ts',
      '/mnt/data/EnhancedAppSidebar.tsx',
      '/mnt/data/SmartCartSidebar.tsx',
      '/mnt/data/design-system.css',
      '/mnt/data/globals.css',
      '/mnt/data/index.css',
      '/mnt/data/tailwind.config.ts',
      '/mnt/data/useBasket.ts',
      '/mnt/data/useAuth.ts',
      '/mnt/data/OrderingSuggestions.ts',
      'sidebar.tsx',
      'sidebar-provider.tsx',
      'use-sidebar.ts',
      'sidebar-constants.ts',
      'EnhancedAppSidebar.tsx',
      'SmartCartSidebar.tsx',
      'design-system.css',
      'globals.css',
      'index.css',
      'tailwind.config.ts',
      'useBasket.ts',
      'useAuth.ts',
      'OrderingSuggestions.ts',
    ],
  },

  cart: {
    requested: [
      'BasketProvider.tsx',
      'useBasket.ts',
      'AddToCartButton.tsx',
      'CartDrawer.tsx',
      'QuantityStepper.tsx',
      'flyToCart.ts',
      'OrderComposer.tsx',
      'useOrderingSuggestions.tsx',
      'useDeliveryOptimization.tsx',
      'DeliveryCalculator.ts',
      'index.css',
    ],
  },

  topbar: {
    requested: [
      'TopNavigation.tsx',
      'AppLayout.tsx',
      'FullWidthLayout.tsx',
      'AppChrome.tsx',
      'TenantSwitcher.tsx',
      'LanguageSwitcher.tsx',
      'HeaderSearch.tsx',
      'CartDrawer.tsx',
      'layout-vars.css',
      'globals.css',
      'index.css',
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
]

// when multiple files share a basename, prefer these roots
const PREFER = [
  'src/pages/**',
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
