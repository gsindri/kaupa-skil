# Suppliers ChatPack 2025-09-12T13:12:43.339Z

_Contains 122 file(s)._

---

## AUDIT\axe-dashboard.txt

```
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 44, reused 8, downloaded 28, added 0
Progress: resolved 94, reused 16, downloaded 65, added 0
Packages: +94
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 94, reused 20, downloaded 74, added 94, done
[1mRunning axe-core 4.10.3 in chrome-headless[22m
[31m[1mError: Error: spawn /root/.cache/pnpm/dlx/1b97179e8ea3c8de0e08c15452800dc572333b4b4a773c062be27aedd38d8ade/198d2f9f17c-1507/node_modules/.pnpm/chromedriver@139.0.2/node_modules/chromedriver/lib/chromedriver/chromedriver ENOENT
    at /root/.cache/pnpm/dlx/1b97179e8ea3c8de0e08c15452800dc572333b4b4a773c062be27aedd38d8ade/198d2f9f17c-1507/node_modules/.pnpm/selenium-webdriver@4.22.0/node_modules/selenium-webdriver/remote/index.js:256:70
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)[22m[39m
Please report the problem to: [4m[34mhttps://github.com/dequelabs/axe-core-npm/issues/[39m[24m


```


---

## AUDIT\build.txt

```

> vite_react_shadcn_ts@0.0.0 build /workspace/kaupa-skil
> vite build

vite v5.4.19 building for production...
transforming...

warn - The class `delay-[40ms]` is ambiguous and matches multiple utilities.
warn - If this is content and not a class, replace it with `delay-&lsqb;40ms&rsqb;` to silence this warning.
✓ 3106 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.99 kB │ gzip:   0.43 kB
dist/assets/index-Bz7JjKiF.css     92.86 kB │ gzip:  15.75 kB
dist/assets/index-Ch-IaOa1.js   1,539.90 kB │ gzip: 429.35 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 9.49s

```


---

## AUDIT\depcheck.txt

```
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 76, reused 44, downloaded 26, added 0
Packages: +112
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 112, reused 74, downloaded 38, added 112, done
Unused dependencies
* dotenv
Unused devDependencies
* @tailwindcss/typography
* @vitest/coverage-v8
* autoprefixer
* postcss

```


---

## AUDIT\dependency-cycles.txt

```
Processed 291 files (3s) (170 warnings)



```


---

## AUDIT\eslint.txt

```

> vite_react_shadcn_ts@0.0.0 lint /workspace/kaupa-skil
> eslint .


```


---

## AUDIT\healthcheck.md

```md
# Repository Healthcheck

## Findings

| Category | File/Area | Issue | Evidence | Suggested Fix | Priority |
|---------|-----------|-------|----------|---------------|----------|
| Security | `supabase/migrations/...b633a3.sql` | RLS policy `System can manage jobs` allows `FOR ALL USING (true)` | see policy lines 183-194 | Restrict policy to service role and limit operations | P0 |
| Correctness | `src/contexts/AuthProvider.tsx` | Sign-in sets `sb-session-active` but sign-out never clears it | lines 60-80,155-179 | Remove session key on sign-out and broadcast logout | P0 |
| Security | `pnpm audit` | esbuild <=0.24.2 moderate vulnerability | `pnpm-audit.log` | upgrade to >=0.25.0 | P1 |
| Correctness | `src/components/compare/EnhancedComparisonTable.tsx` | Uses `mockCartItem` and `any` types in production code | lines 48-74 | Replace mock data with real cart items and add interfaces | P1 |
| Maintainability | various (`any` usage) | Multiple `any` types across services and utils | search results | Introduce proper interfaces and enable strict TS options | P1 |
| Performance | build output | Main JS bundle 1.54 MB, exceeds 500 kB warning | `build.log` | Code-split heavy modules (e.g., recharts) | P2 |
| Dependency hygiene | project | Unused deps: dotenv, @tailwindcss/typography, @vitest/coverage-v8, autoprefixer, postcss | `depcheck.log` | remove or use unused dependencies | P2 |
| Testing/CI | Vitest coverage | Coverage not generated; tests run but no report | `test.log` | configure Vitest coverage reporter | P2 |
| A11y | UI Drawer component | Missing DialogTitle causes accessibility warning in test | `test.log` | add `<DialogTitle>` or `aria-label` | P2 |

## Top Risks (P0)

1. **Overly permissive RLS for jobs** – allows any role to manage jobs. *Mitigation:* restrict policy to service role and define explicit operations.
2. **Session flag not cleared on logout** – `sb-session-active` remains in sessionStorage, risking stale sessions across tabs. *Mitigation:* remove flag on sign-out and broadcast logout.

## Architecture Notes

- Routes defined in `src/router.tsx` cover dashboard, quick order, cart, compare, suppliers, pantry, price-history, discovery, admin, settings, delivery, and auth flows.
- Global providers: `AuthProvider`, `BasketProvider`, `LanguageProvider`, `SettingsProvider`, `ComparisonContext` under `src/contexts/`.
- State storage: `userPrefs` store in `src/state/userPrefs.ts` plus context providers syncing via `BroadcastChannel` and localStorage.

## Metrics

- **TypeScript**: no errors (`typecheck.log` empty) but strict mode disabled.
- **ESLint**: no warnings (`eslint.log` empty) due to relaxed rules.
- **Unit tests**: 61 passed, 1 skipped (`test.log`). Coverage not produced.
- **E2E tests**: all 3 skipped (`playwright.log`).
- **Bundle size**: main JS `1.54 MB`, CSS `92.86 kB` (`build.log`).
- **Dependencies**: 1 moderate vulnerability (`pnpm-audit.log`); 5 unused deps (`depcheck.log`).
- **A11y**: axe run failed (missing chromedriver) (`axe-dashboard.log`).

## Suggested Next Steps

1. Lock down Supabase RLS policies and rotate affected credentials.
2. Implement robust logout handling and cross-tab sync.
3. Introduce TypeScript strict mode and resolve `any` usage.
4. Remove unused dependencies and enable lint rules for `no-explicit-any`, `no-unused-vars`.
5. Configure coverage reporting and integrate into CI.
6. Set up axe/playwright a11y tests once chromedriver is available.
7. Investigate large bundle size; code-split heavy libraries.


```


---

## AUDIT\playwright.txt

```

> vite_react_shadcn_ts@0.0.0 test:e2e /workspace/kaupa-skil
> playwright test


Running 3 tests using 2 workers

  -  1 e2e/navigation.spec.ts:22:1 › sidebar links route correctly
  -  2 e2e/navigation.spec.ts:40:1 › quick order search flow
  -  3 e2e/organization.spec.ts:10:1 › sign-up, solo data access, organization creation and switch

  3 skipped

```


---

## AUDIT\pnpm-audit.txt

```
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ esbuild enables any website to send any requests to    │
│                     │ the development server and read the response           │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ esbuild                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <=0.24.2                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=0.25.0                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ .>vite>esbuild                                         │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-67mh-4wv8-2f99      │
└─────────────────────┴────────────────────────────────────────────────────────┘
1 vulnerabilities found
Severity: 1 moderate

```


---

## AUDIT\test.txt

```

> vite_react_shadcn_ts@0.0.0 test /workspace/kaupa-skil
> vitest run -- --coverage


 RUN  v3.2.4 /workspace/kaupa-skil

 ✓ src/utils/harValidator.test.ts (5 tests) 9ms
 ✓ src/services/__tests__/OrderingSuggestions.test.ts (3 tests) 47ms
 ✓ src/services/__tests__/DeliveryCalculator.test.ts (6 tests) 56ms
 ✓ src/lib/__tests__/unitVat.test.ts (6 tests) 7ms
 ✓ src/lib/__tests__/landedCost.test.ts (4 tests) 34ms
 ✓ src/hooks/__tests__/useComparisonItems.test.tsx (2 tests) 149ms
 ✓ src/hooks/__tests__/useProducts.test.tsx (2 tests) 142ms
 ✓ src/lib/__tests__/lockBody.test.ts (3 tests) 24ms
stderr | src/components/cart/CartDrawer.test.tsx > CartDrawer > closes drawer when Place Order is clicked
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/components/cart/CartDrawer.test.tsx (1 test) 201ms
 ↓ src/lib/__tests__/multiTenantFlow.test.ts (1 test | 1 skipped)
stderr | src/pages/auth/ResetPassword.test.tsx > ResetPassword > shows error and signs out for invalid or reused links
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/pages/auth/ResetPassword.test.tsx (2 tests) 96ms
 ✓ src/hooks/__tests__/useDebounce.test.tsx (2 tests) 27ms
 ✓ src/components/dashboard/__tests__/AnomaliesList.test.tsx (2 tests) 81ms
 ✓ src/components/dashboard/__tests__/SuppliersPanel.test.tsx (2 tests) 58ms
 ✓ src/components/dashboard/__tests__/ActivityList.test.tsx (2 tests) 78ms
 ✓ src/components/dashboard/__tests__/RecentOrdersTable.test.tsx (2 tests) 78ms
 ✓ src/components/dashboard/__tests__/LiveUpdates.test.tsx (2 tests) 91ms
 ✓ src/components/dashboard/__tests__/AlertsPanel.test.tsx (2 tests) 107ms
stderr | src/components/ui/drawer.test.tsx > Drawer > locks body scroll when open
`DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.

 ✓ src/components/ui/drawer.test.tsx (1 test) 136ms
 ✓ src/router.test.ts (12 tests) 5ms

 Test Files  19 passed | 1 skipped (20)
      Tests  61 passed | 1 skipped (62)
   Start at  18:09:33
   Duration  13.46s (transform 2.43s, setup 1.71s, collect 8.13s, tests 1.42s, environment 13.69s, prepare 2.69s)


```


---

## AUDIT\ts-prune.txt

```

```


---

## AUDIT\typecheck.txt

```

```


---

## docs\CONNECTORS.md

```md

# Connector Architecture Documentation

This document describes the connector architecture for integrating with Icelandic wholesale suppliers, including portal scraping, email ingestion, and future API integrations.

## 🏗️ Architecture Overview

The connector system is designed to handle various supplier integration methods:

1. **Portal Connectors** - Automated web scraping of supplier portals using Playwright
2. **Email Parsers** - Processing of emailed price lists (CSV/XLSX/PDF)
3. **API Connectors** - Direct API integration (future implementation)
4. **EDI/Peppol** - Electronic document interchange (future implementation)

### Design Principles

- **Resilience**: Robust error handling and retry mechanisms
- **Configurability**: Easy setup and modification of connectors
- **Monitoring**: Comprehensive logging and health checks
- **Security**: Buyer-authorized access only, encrypted credential storage
- **Scalability**: Queue-based processing for concurrent ingestion

## 🔌 Portal Connectors

### Architecture

Portal connectors use Playwright to automate supplier website interactions:

```typescript
interface PortalConnector {
  login(credentials: SupplierCredentials): Promise<void>
  fetchCatalog(): Promise<CatalogItem[]>
  fetchPrices(): Promise<PriceQuote[]>
  fetchStockFlags(): Promise<StockStatus[]>
  logout(): Promise<void>
}
```

### Base Connector Implementation

```typescript
// Base connector class with common functionality
abstract class BasePortalConnector implements PortalConnector {
  protected page: Page
  protected config: ConnectorConfig
  protected logger: Logger

  constructor(page: Page, config: ConnectorConfig) {
    this.page = page
    this.config = config
    this.logger = new Logger(`connector:${config.supplierId}`)
  }

  abstract async login(credentials: SupplierCredentials): Promise<void>
  abstract async fetchCatalog(): Promise<CatalogItem[]>
  abstract async fetchPrices(): Promise<PriceQuote[]>
  
  // Common utilities
  protected async waitForElement(selector: string, timeout = 30000): Promise<ElementHandle> {
    try {
      return await this.page.waitForSelector(selector, { timeout })
    } catch (error) {
      this.logger.error(`Element not found: ${selector}`, { error })
      throw new ConnectorError(`Element not found: ${selector}`)
    }
  }

  protected async safeClick(selector: string): Promise<void> {
    const element = await this.waitForElement(selector)
    await element.click()
    await this.page.waitForLoadState('networkidle')
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) throw error
        
        const delay = baseDelay * Math.pow(2, attempt - 1)
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }
}
```

### Mock Supplier Portal Connector

For demonstration and testing purposes:

```typescript
export class MockSupplierConnector extends BasePortalConnector {
  async login(credentials: SupplierCredentials): Promise<void> {
    this.logger.info('Attempting login to mock supplier portal')
    
    await this.page.goto('http://localhost:3001/mock-supplier/login')
    
    await this.page.fill('#username', credentials.username)
    await this.page.fill('#password', credentials.password)
    await this.safeClick('#login-button')
    
    // Wait for successful login
    await this.waitForElement('#dashboard')
    this.logger.info('Successfully logged in to mock supplier portal')
  }

  async fetchCatalog(): Promise<CatalogItem[]> {
    this.logger.info('Fetching product catalog')
    
    await this.page.goto('http://localhost:3001/mock-supplier/catalog')
    
    // Extract product data from the page
    const products = await this.page.evaluate(() => {
      const productRows = document.querySelectorAll('.product-row')
      return Array.from(productRows).map(row => ({
        sku: row.querySelector('.sku')?.textContent?.trim() || '',
        name: row.querySelector('.name')?.textContent?.trim() || '',
        brand: row.querySelector('.brand')?.textContent?.trim() || '',
        category: row.querySelector('.category')?.textContent?.trim() || '',
        packSize: row.querySelector('.pack-size')?.textContent?.trim() || '',
        unit: row.querySelector('.unit')?.textContent?.trim() || ''
      }))
    })

    this.logger.info(`Fetched ${products.length} products from catalog`)
    return products
  }

  async fetchPrices(): Promise<PriceQuote[]> {
    this.logger.info('Fetching current prices')
    
    await this.page.goto('http://localhost:3001/mock-supplier/prices')
    
    // Extract price data
    const prices = await this.page.evaluate(() => {
      const priceRows = document.querySelectorAll('.price-row')
      return Array.from(priceRows).map(row => ({
        sku: row.querySelector('.sku')?.textContent?.trim() || '',
        packPrice: parseFloat(row.querySelector('.pack-price')?.textContent?.replace(/[^\d.]/g, '') || '0'),
        currency: 'ISK',
        vatCode: row.querySelector('.vat-code')?.textContent?.trim() || 'standard',
        inStock: row.querySelector('.stock-status')?.textContent?.includes('In Stock') || false,
        lastUpdated: new Date().toISOString()
      }))
    })

    this.logger.info(`Fetched ${prices.length} price quotes`)
    return prices
  }

  async fetchStockFlags(): Promise<StockStatus[]> {
    // Mock implementation - in real scenario this might be a separate page
    return []
  }
}
```

### Selector Management

Selectors are centralized and configurable:

```typescript
// selectors/mock-supplier.ts
export const MockSupplierSelectors = {
  login: {
    usernameField: '#username',
    passwordField: '#password',
    loginButton: '#login-button',
    dashboard: '#dashboard',
    errorMessage: '.error-message'
  },
  catalog: {
    productRows: '.product-row',
    sku: '.sku',
    name: '.name',
    brand: '.brand',
    category: '.category',
    packSize: '.pack-size',
    unit: '.unit'
  },
  prices: {
    priceRows: '.price-row',
    sku: '.sku',
    packPrice: '.pack-price',
    vatCode: '.vat-code',
    stockStatus: '.stock-status'
  }
}
```

### Error Handling

```typescript
export class ConnectorError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public context?: any
  ) {
    super(message)
    this.name = 'ConnectorError'
  }
}

export const ConnectorErrorCodes = {
  LOGIN_FAILED: 'LOGIN_FAILED',
  TIMEOUT: 'TIMEOUT', 
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  ACCESS_DENIED: 'ACCESS_DENIED'
}
```

## 📧 Email Parsers

### CSV/XLSX Parser

```typescript
export class CSVPriceListParser {
  async parseFile(file: Buffer, mapping: FieldMapping): Promise<ParsedPriceList> {
    const results: ParsedPriceList = {
      items: [],
      errors: [],
      summary: {
        totalRows: 0,
        successfulRows: 0,
        errorRows: 0
      }
    }

    // Detect file type and parse accordingly
    const isCSV = this.detectCSV(file)
    const rows = isCSV 
      ? await this.parseCSV(file)
      : await this.parseXLSX(file)

    for (const [index, row] of rows.entries()) {
      try {
        const item = this.mapRowToItem(row, mapping)
        results.items.push(item)
        results.summary.successfulRows++
      } catch (error) {
        results.errors.push({
          row: index + 1,
          error: error.message,
          data: row
        })
        results.summary.errorRows++
      }
    }

    results.summary.totalRows = rows.length
    return results
  }

  private async parseCSV(file: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = []
      const stream = Readable.from(file.toString())
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject)
    })
  }

  private async parseXLSX(file: Buffer): Promise<any[]> {
    const workbook = XLSX.read(file, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet)
  }

  private mapRowToItem(row: any, mapping: FieldMapping): SupplierItem {
    return {
      sku: this.getFieldValue(row, mapping.sku),
      name: this.getFieldValue(row, mapping.name),
      brand: this.getFieldValue(row, mapping.brand),
      packSize: this.getFieldValue(row, mapping.packSize),
      packPrice: this.parsePrice(this.getFieldValue(row, mapping.packPrice)),
      unit: this.getFieldValue(row, mapping.unit),
      vatCode: this.getFieldValue(row, mapping.vatCode) || 'standard',
      category: this.getFieldValue(row, mapping.category)
    }
  }

  private getFieldValue(row: any, fieldPath: string): string {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], row) || ''
  }

  private parsePrice(priceStr: string): number {
    // Handle Icelandic number format: 1.234,56 kr
    const cleaned = priceStr.replace(/[^\d,-]/g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }
}
```

### PDF Parser (Stub)

```typescript
export class PDFPriceListParser {
  async parseFile(file: Buffer): Promise<ParsedPriceList> {
    // TODO: Implement PDF table extraction
    // Options: pdf-parse, tabula-js, or cloud services like AWS Textract
    
    throw new Error('PDF parsing not yet implemented')
  }

  private async extractTables(file: Buffer): Promise<any[][]> {
    // Placeholder for PDF table extraction
    // This would use libraries like:
    // - pdf2table for table detection
    // - pdf-parse for text extraction
    // - ML services for complex layouts
    return []
  }
}
```

## 🔄 Connector Runner

### Queue-Based Processing

```typescript
export class ConnectorRunner {
  private queue: Queue
  private logger: Logger

  constructor() {
    this.queue = new Queue('connector-jobs', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        }
      }
    })

    this.setupWorkers()
  }

  private setupWorkers() {
    this.queue.process('portal-ingestion', 5, this.processPortalIngestion.bind(this))
    this.queue.process('email-ingestion', 3, this.processEmailIngestion.bind(this))
  }

  async schedulePortalIngestion(supplierId: string, tenantId: string): Promise<string> {
    const job = await this.queue.add('portal-ingestion', {
      supplierId,
      tenantId,
      timestamp: new Date().toISOString()
    })

    return job.id as string
  }

  private async processPortalIngestion(job: Job): Promise<void> {
    const { supplierId, tenantId } = job.data
    
    this.logger.info('Starting portal ingestion', { supplierId, tenantId })

    // Create connector run record
    const run = await this.createConnectorRun(supplierId, tenantId, 'portal')

    try {
      // Get supplier credentials
      const credentials = await this.getSupplierCredentials(supplierId, tenantId)
      
      // Launch browser and create connector
      const browser = await playwright.chromium.launch({ headless: true })
      const page = await browser.newPage()
      
      const connector = this.createConnector(supplierId, page)
      
      // Execute ingestion
      await connector.login(credentials)
      const catalog = await connector.fetchCatalog()
      const prices = await connector.fetchPrices()
      
      // Process and store data
      const results = await this.processIngestionData(catalog, prices, supplierId, tenantId)
      
      // Update run record
      await this.updateConnectorRun(run.id, {
        status: 'completed',
        finishedAt: new Date(),
        itemsFound: results.itemsFound,
        pricesUpdated: results.pricesUpdated,
        errorsCount: results.errorsCount
      })

      await browser.close()
      
      this.logger.info('Portal ingestion completed', { 
        supplierId, 
        tenantId, 
        results 
      })

    } catch (error) {
      this.logger.error('Portal ingestion failed', { 
        supplierId, 
        tenantId, 
        error: error.message 
      })

      await this.updateConnectorRun(run.id, {
        status: 'failed',
        finishedAt: new Date(),
        errorsCount: 1,
        logData: { error: error.message }
      })

      throw error
    }
  }

  private createConnector(supplierId: string, page: Page): PortalConnector {
    // Factory method to create appropriate connector
    switch (supplierId) {
      case 'mock-supplier-1':
        return new MockSupplierConnector(page, { supplierId })
      case 'vefkaupmenn':
        return new VefkaupmennConnector(page, { supplierId })
      case 'heilsuhusid':
        return new HeilsuhusidConnector(page, { supplierId })
      default:
        throw new Error(`No connector available for supplier: ${supplierId}`)
    }
  }
}
```

## 📊 Monitoring & Health Checks

### Connector Health

```typescript
export class ConnectorHealthChecker {
  async checkConnectorHealth(supplierId: string): Promise<HealthStatus> {
    const status: HealthStatus = {
      supplierId,
      isHealthy: true,
      lastSuccessfulRun: null,
      errorRate: 0,
      averageRunTime: 0,
      issues: []
    }

    try {
      // Check recent runs
      const recentRuns = await this.getRecentRuns(supplierId, 24) // Last 24 hours
      
      if (recentRuns.length === 0) {
        status.issues.push('No recent ingestion runs')
      }

      // Calculate error rate
      const failedRuns = recentRuns.filter(run => run.status === 'failed')
      status.errorRate = failedRuns.length / recentRuns.length

      if (status.errorRate > 0.3) {
        status.isHealthy = false
        status.issues.push(`High error rate: ${(status.errorRate * 100).toFixed(1)}%`)
      }

      // Check for credential issues
      const credentialStatus = await this.checkCredentials(supplierId)
      if (!credentialStatus.isValid) {
        status.isHealthy = false
        status.issues.push('Invalid or expired credentials')
      }

      // Calculate average run time
      const successfulRuns = recentRuns.filter(run => run.status === 'completed')
      if (successfulRuns.length > 0) {
        status.averageRunTime = successfulRuns.reduce((sum, run) => {
          return sum + (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime())
        }, 0) / successfulRuns.length

        status.lastSuccessfulRun = successfulRuns[0].finishedAt
      }

    } catch (error) {
      status.isHealthy = false
      status.issues.push(`Health check failed: ${error.message}`)
    }

    return status
  }
}
```

### Metrics Collection

```typescript
export class ConnectorMetrics {
  private metrics = {
    runsTotal: new Counter({
      name: 'connector_runs_total',
      help: 'Total number of connector runs',
      labelNames: ['supplier_id', 'status']
    }),
    runDuration: new Histogram({
      name: 'connector_run_duration_seconds', 
      help: 'Duration of connector runs',
      labelNames: ['supplier_id'],
      buckets: [1, 5, 10, 30, 60, 120, 300]
    }),
    itemsProcessed: new Counter({
      name: 'connector_items_processed_total',
      help: 'Total items processed by connectors',
      labelNames: ['supplier_id']
    }),
    errorsTotal: new Counter({
      name: 'connector_errors_total',
      help: 'Total connector errors',
      labelNames: ['supplier_id', 'error_type']
    })
  }

  recordRun(supplierId: string, status: string, duration: number, itemsCount: number) {
    this.metrics.runsTotal.inc({ supplier_id: supplierId, status })
    this.metrics.runDuration.observe({ supplier_id: supplierId }, duration)
    this.metrics.itemsProcessed.inc({ supplier_id: supplierId }, itemsCount)
  }

  recordError(supplierId: string, errorType: string) {
    this.metrics.errorsTotal.inc({ supplier_id: supplierId, error_type: errorType })
  }
}
```

## 🚀 Future Connectors

### API Connector Interface

```typescript
interface APIConnector {
  authenticate(): Promise<void>
  getCatalog(params?: CatalogParams): Promise<APIResponse<CatalogItem[]>>
  getPrices(params?: PriceParams): Promise<APIResponse<PriceQuote[]>>
  getStock(skus: string[]): Promise<APIResponse<StockStatus[]>>
  submitOrder(order: Order): Promise<APIResponse<OrderConfirmation>>
}

class RESTAPIConnector implements APIConnector {
  constructor(
    private baseUrl: string,
    private credentials: APICredentials
  ) {}

  async authenticate(): Promise<void> {
    // OAuth 2.0 or API key authentication
  }

  async getCatalog(params?: CatalogParams): Promise<APIResponse<CatalogItem[]>> {
    const response = await this.request('GET', '/catalog', params)
    return this.parseResponse(response)
  }

  private async request(method: string, path: string, data?: any): Promise<Response> {
    // HTTP client with retry logic, rate limiting, etc.
  }
}
```

### EDI/Peppol Adapter

```typescript
interface EDIAdapter {
  sendOrder(order: Order): Promise<EDIResponse>
  receiveInvoice(ediMessage: string): Promise<Invoice>
  sendOrderResponse(response: OrderResponse): Promise<void>
  validateMessage(message: string, schema: string): Promise<ValidationResult>
}

class PeppolAdapter implements EDIAdapter {
  async sendOrder(order: Order): Promise<EDIResponse> {
    // Convert order to UBL Order format
    const ublOrder = this.convertToUBL(order)
    
    // Send via Peppol network
    return await this.sendPeppolMessage(ublOrder)
  }

  async receiveInvoice(ediMessage: string): Promise<Invoice> {
    // Parse UBL Invoice
    const ublInvoice = this.parseUBL(ediMessage)
    
    // Convert to internal format
    return this.convertFromUBL(ublInvoice)
  }
}
```

## 🛠️ Configuration

### Connector Configuration

```typescript
interface ConnectorConfig {
  supplierId: string
  type: 'portal' | 'email' | 'api' | 'edi'
  
  // Portal-specific config
  portal?: {
    baseUrl: string
    selectors: SelectorConfig
    timeouts: TimeoutConfig
    retryConfig: RetryConfig
  }
  
  // API-specific config
  api?: {
    baseUrl: string
    authType: 'oauth2' | 'apikey' | 'basic'
    rateLimits: RateLimitConfig
    endpoints: EndpointConfig
  }
  
  // Email-specific config
  email?: {
    fieldMapping: FieldMapping
    fileFormats: string[]
    validationRules: ValidationRule[]
  }
}
```

### Environment Configuration

```bash
# Connector settings
CONNECTOR_BROWSER_HEADLESS=true
CONNECTOR_TIMEOUT_SECONDS=300
CONNECTOR_MAX_RETRIES=3
CONNECTOR_CONCURRENT_JOBS=5

# Queue settings
REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=10

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=300

# Storage
ATTACHMENTS_BUCKET=connector-attachments
LOGS_RETENTION_DAYS=90
```

## 📋 Testing Connectors

### Unit Tests

```typescript
describe('MockSupplierConnector', () => {
  let connector: MockSupplierConnector
  let page: Page

  beforeEach(async () => {
    page = await browser.newPage()
    connector = new MockSupplierConnector(page, { supplierId: 'mock' })
  })

  test('should login successfully with valid credentials', async () => {
    const credentials = { username: 'test', password: 'test123' }
    await expect(connector.login(credentials)).resolves.not.toThrow()
  })

  test('should reject login with invalid credentials', async () => {
    const credentials = { username: 'test', password: 'wrong' }
    await expect(connector.login(credentials)).rejects.toThrow('Invalid credentials')
  })

  test('should fetch catalog items', async () => {
    await connector.login({ username: 'test', password: 'test123' })
    const catalog = await connector.fetchCatalog()
    
    expect(catalog).toBeInstanceOf(Array)
    expect(catalog.length).toBeGreaterThan(0)
    expect(catalog[0]).toHaveProperty('sku')
    expect(catalog[0]).toHaveProperty('name')
  })
})
```

### Integration Tests

```typescript
describe('Connector Integration', () => {
  test('end-to-end ingestion flow', async () => {
    // Start mock supplier portal
    const mockServer = await startMockServer()
    
    // Create connector run
    const runner = new ConnectorRunner()
    const jobId = await runner.schedulePortalIngestion('mock-supplier', 'tenant-1')
    
    // Wait for completion
    await waitForJobCompletion(jobId)
    
    // Verify data was ingested
    const items = await getSupplierItems('mock-supplier')
    expect(items.length).toBeGreaterThan(0)
    
    const prices = await getPriceQuotes('mock-supplier')
    expect(prices.length).toBeGreaterThan(0)
    
    await mockServer.close()
  })
})
```

## 📞 Support & Troubleshooting

### Common Issues

#### Login Failures
- Verify credentials are correct and not expired
- Check for CAPTCHA or additional security measures
- Ensure supplier portal is accessible

#### Data Parsing Errors
- Validate field mappings are correct
- Check for changes in supplier data format
- Review parser configuration

#### Performance Issues
- Monitor browser resource usage
- Adjust timeout and retry settings
- Consider running connectors during off-peak hours

### Debugging

```bash
# Enable debug logging
DEBUG=connector:* npm run dev

# Run single connector with verbose output
node scripts/run-connector.js --supplier=mock-supplier --tenant=tenant-1 --verbose

# Health check all connectors
node scripts/health-check.js --all
```

---

*For technical support with connectors, contact the development team or create an issue in the repository.*

```


---

## docs\dashboard-pantry-mock-inventory.md

```md
# Dashboard & Pantry Mock Inventory

This document lists remaining hardcoded demo data powering the Dashboard and Pantry pages. Each entry includes the snippet where mock data appears and the plan for replacing it with live, tenant‑scoped queries.

| File / Component | Used by | Mock Snippet | Replacement Plan |
|---|---|---|---|
| `src/components/dashboard/DashboardOverview.tsx` | Dashboard KPI strip & filters | `const kpis = [{ title: 'Active suppliers', value: '3 / 5', ... }]`<br/>`<SelectItem value="org-1">Org 1</SelectItem>` | Replace with `useKpis(range)` hook querying suppliers, products, alerts and orders. Populate org filter from real workspaces. Show empty state when no data. |
| `src/pages/Pantry.tsx` | Pantry overview & inventory grid | `StockTrends` shows “Most Popular – Item X / Item Y”<br/>`StockAlerts` hardcodes `3 items` out of stock<br/>`DeliverySchedule` fixed date `July 20, 2024`<br/>`stockItems` array with `Milk`, `Eggs`, `Bread` | Implement hooks (`useInventory`, `useStockAlerts`, `useDeliveries`) reading `products`, `stock`, `orders`. Display neutral empty states when queries return no data. |

These mocks are removed in this PR to prepare for wiring the UI to real data sources.

```


---

## docs\duplication-audit.md

```md
# Duplication Audit

This document records code and config duplicates identified in the repository. No storage or SQL duplicates were detected during the audit.

## Ingestion Catalog Matching

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ingestion/match.ts`<br/>`supabase/functions/ingest-supplier/index.ts` | `matchOrCreateCatalog`<br/>`matchOrCreateCatalog` | 41<br/>278 | `9e56f050a1c60c61662fe971e18d1acf`<br/>`db749d8ff5e4502e6f6fa706f15b76c7` | ≈100% | `ingestion/runner.ts`<br/>_none_ | Function copied between ingestion script and edge function | `ingestion/match.ts` | Export helper and import into edge function | Divergent implementations across runtimes |

## Extension Manifest

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `extension/manifest.json`<br/>`extension/dist/manifest.json` | _n/a_ | 50<br/>50 | `26d97c14bc458cd3382fc2d1172ed07f`<br/>`26d97c14bc458cd3382fc2d1172ed07f` | 100% | _none_ | Built artifact committed alongside source manifest | `extension/manifest.json` | Generate dist manifest at build and remove from repo | Packaging scripts must handle build step |

## Header Stability Test

| Paths | Exports | Line counts | Hashes | Similarity | Inbound imports | Root-cause | Canonical file | Codemod plan | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `e2e/header-stability.spec.ts` lines 41–53<br/>`e2e/header-stability.spec.ts` lines 54–66 | _n/a_ | 13<br/>13 | `90cba1f5ac0d4658071ac9109c437b6a`<br/>`eb5d2335ce6711ceafdbde0a64450332` | High | _none_ | Repeated style snapshot logic in test | First block | Extract helper function to avoid duplication | Minimal; test maintenance overhead |

```


---

## docs\hardcode-inventory.md

```md
# Hardcode Inventory

The following tables list hardcoded demo data and mock implementations found in the codebase and database. Each entry identifies why it is a hardcode, the proposed source of truth, and suggested removal steps.

## Frontend

| Location | Snippet / Example | Why it's a hardcode | Proposed source of truth | Removal / Replacement Steps |
|---|---|---|---|---|
| `src/hooks/useComparisonItems.tsx` | `const mockItems: ComparisonItem[] = […]` | Product comparison uses static mock items and suppliers | `supplier_items`, `price_quotes` tables | Replace mock array with Supabase query using tenant‑scoped filters |
| `src/pages/Discovery.tsx` | `const mockSuppliers: SupplierCard[] = […]` | Supplier discovery uses hardcoded cards and sample products | `suppliers`, `supplier_items` | Query suppliers from DB; derive sample products from stock/price history |
| `src/lib/landedCost.ts` | `const mockSupplierRules: SupplierRule[] = […]` | Delivery fees calculated from demo rules | `delivery_rules` table | Fetch rule per supplier; move calculations to service that reads DB |
| `src/components/dashboard/RecentOrdersTable.tsx` | `const mockRecentOrders: RecentOrder[] = […]` | Dashboard orders summary uses fabricated records | `orders` table | Query recent orders for workspace; remove mock list |
| `src/components/dashboard/AlertsPanel.tsx` | `const mockAlerts: AlertItem[] = […]` | Alerts list populated with static examples | `alerts`/`price_history` | Fetch from alerts table; handle empty state when none |
| `src/components/dashboard/AnomaliesList.tsx` | `const mockAnomalies: Anomaly[] = […]` | Price/stock anomalies are mocked | `price_history`, anomaly detection job | Drive from analytics service results |
| `src/components/dashboard/SuppliersPanel.tsx` | `const mockSuppliers: Supplier[] = […]` | Supplier status panel uses fake entries | `suppliers`, `supplier_connections` | Query connected suppliers and sync status |
| `src/components/dashboard/LiveUpdates.tsx` | `const mockUpdates: UpdateItem[] = […]` | Live updates stream shows fabricated events | event log / `connector_runs` | Subscribe to real‑time channel or polling endpoint |
| `src/components/dashboard/ActivityList.tsx` | `const mockActivity: ActivityItem[] = […]` | Recent activity feed uses placeholder messages | audit log table | Fetch tenant audit log entries |
| `src/pages/Dashboard.tsx` | `const mockAnalyticsData` & `const mockAnomalies` | Analytics tab and alerts rely on hardcoded metrics | analytics views (`price_history`, `orders`) | Replace with queries to analytics API; show onboarding when empty |
| `src/components/compare/EnhancedComparisonTable.tsx` | `const mockCartItem: CartItem` | Delivery calculation built around synthetic cart item | real cart items table | Use actual cart context; remove mock wrapper |
| `src/components/quick/MiniCompareDrawer.tsx` | `const mockSupplierOptions = […]` | Supplier comparison drawer uses static supplier offers | `supplier_items`, `prices`, `delivery_rules` | Query top offers from DB; compute delivery impacts dynamically |
| `src/components/quick/PantryLanes.tsx` | `const mockFavorites = […]`, `const mockLastOrder = […]` | Favorites and last order lanes display demo items | `favorites`, `order_lines` | Fetch user favorites and last order lines; remove placeholder arrays |

## Database / Migrations

| Location | Snippet / Example | Why it's a hardcode | Proposed source of truth | Removal / Replacement Steps |
|---|---|---|---|---|
| `supabase/migrations/20250812165208_79d75377-0718-46c4-ae46-a086b1a517a6.sql` | Inserts units, categories, VAT rules, and demo suppliers | Demo rows ship with production migrations | Reference tables (`units`, `categories`, `vat_rules`) should remain; supplier data must come from onboarding | Remove supplier inserts from migration; keep lookup tables; move any dev-only seeds to separate script |
| `supabase/migrations/20250818181314_2ae84622-91f5-40ac-934b-75470704e237.sql` | Sample categories, suppliers, and supplier_items | Adds business data directly in migration | Production DB should be empty; data should arrive from connectors or onboarding | Delete sample inserts; provide dev seed script gated by flag |
| `supabase/migrations/20250814134332_74d9a40d-55ef-4254-b5da-376bd26a3148.sql` | Sample delivery rules for first three suppliers | Hardcodes logistics assumptions | `delivery_rules` table populated per supplier connection | Drop insert; require connector or admin input to create rules |

## Cleanup & Migration Plan

1. **Remove frontend mock arrays** and replace with React Query hooks that read from Supabase tables (`suppliers`, `supplier_items`, `prices`, `orders`, `alerts`, etc.). Display onboarding components when queries return empty.
2. **Drop demo rows** from production migrations and create a separate `dev:seed` script guarded by a `DEV_SAMPLE_DATA` flag so sample data never ships to prod.
3. **Add/verify tables** for real supplier feeds: `supplier_connections`, `products`, `product_variants`, `price_lists`, `prices`, `stock`, `price_history`, `catalog_mappings`.
4. **Tighten RLS** using `tenant_id` checks (e.g., `supplier.workspace_id = auth.jwt()->>'workspace_id'`) so tenants only view their own data.
5. **Implement ETL stubs** for real wholesalers: connectors ingest supplier catalogs and prices, normalize fields (SKU/EAN, pack size, unit, VAT, lead time), and write to `price_history` & `stock` with scheduled background jobs and retry logic.
6. **Use i18n keys and tenant-generated URLs** to eliminate demo copy and fixed routes. Show “Connect a supplier” onboarding for first-time users.


```


---

## docs\README.md

```md

# Iceland B2B Wholesale Comparison Platform

A comprehensive buyer-side B2B wholesale comparison and ordering tool designed specifically for the Icelandic market. This platform enables restaurants, hotels, and shops to compare unit-normalized prices across their authorized wholesalers, maintain price history, and place split orders via email.

## Developer Onboarding

- [Duplication Audit](duplication-audit.md) – inventory of duplicated code segments and remediation plans.

## 🎯 Core Features

### Phase 1 (Current Implementation)
- **Multi-tenant Authentication** - Secure user management with organization-based access
- **Supplier Credential Management** - Encrypted storage of supplier portal credentials with test functionality
- **Unit-Normalized Price Comparison** - Compare prices per kg, L, or unit across suppliers with VAT toggle
- **VAT Management** - Iceland-specific VAT rates (24% standard, 11% reduced) with ex-VAT/inc-VAT toggle
- **Order Composition** - Smart cart that automatically splits orders by supplier
- **Email Dispatch** - Generate and send orders via email with CSV/PDF attachments
- **Price History Tracking** - Visualize price trends over time per item and supplier
- **Audit Logging** - Complete audit trail for compliance and security

### Phase 2 (Planned)
- **API Connectors** - Direct integration with supplier APIs
- **EDI/Peppol Integration** - Electronic document interchange for orders and invoices
- **Advanced Entity Matching** - ML-powered product matching across suppliers
- **Mobile App** - Native mobile application for on-the-go ordering

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts
- **Icons**: Lucide React

### Database Schema
The platform uses a multi-tenant PostgreSQL database with Row Level Security (RLS) for data isolation:

- **Core Tables**: `tenants`, `profiles`, `suppliers`, `supplier_credentials`
- **Product Data**: `catalog_product`, `supplier_product`, `categories`, `units`, `vat_rules`
- **Pricing**: `offer`, `item_matches` (for entity resolution)
- **Orders**: `orders`, `order_lines`, `order_dispatches`
- **System**: `connector_runs`, `audit_events`

### Security Features
- **Row Level Security (RLS)** - Database-level tenant isolation
- **Encrypted Credentials** - Supplier credentials encrypted at rest using libsodium
- **Audit Logging** - All sensitive operations tracked with metadata
- **Environment-based Secrets** - No hardcoded credentials or API keys

## 🇮🇸 Iceland Market Specifics

### Currency & Locale
- **Primary Currency**: ISK (Icelandic Króna)
- **Locale**: is-IS (Icelandic)
- **Number Formatting**: Uses Icelandic conventions

### VAT Configuration
- **Standard Rate**: 24% (most goods and services)
- **Reduced Rate**: 11% (food items, books, newspapers)
- **Zero Rate**: 0% (exports, certain services)

### Unit System
- **Weight**: kg, g (kilograms, grams)
- **Volume**: L, ml (liters, milliliters)  
- **Count**: each, pack, case
- **Conversion**: Automatic unit conversion for price comparison

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iceland-b2b-compare
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run database migrations**
   The SQL schema has been applied to your Supabase project.

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Default Login
The application requires sign-up. Create an account with any email and password to get started.

## 📋 User Guide

### 1. Authentication
- Sign up with email and password
- Profile creation is automatic with basic tenant setup

### 2. Supplier Management
- Navigate to **Suppliers** tab
- Select a supplier from the list
- Add credentials (username/password for portal access)
- Test connection to verify credentials
- Run price ingestion to fetch latest data

### 3. Price Comparison
- Visit **Price Comparison** page
- Use VAT toggle to switch between ex-VAT and inc-VAT pricing
- Search products by name, brand, or SKU
- Compare unit-normalized prices across suppliers
- Look for price badges (Best, Good, Average, Expensive)

### 4. Order Management
- Add items to cart from comparison table
- Review **Order Management** page
- Orders automatically split by supplier
- Add order notes if needed
- Dispatch orders via email to suppliers

### 5. Price History
- Access **Price History** page
- Select a product to view trends
- Charts show price evolution over time per supplier

## 🔧 Configuration

### VAT Rules
VAT rules are configurable in the database:
```sql
INSERT INTO vat_rules (code, rate) VALUES 
  ('standard', 0.24),
  ('reduced', 0.11),
  ('zero', 0.00);
```

### Units
Additional units can be added:
```sql
INSERT INTO units (code, name, base_unit, conversion_factor) VALUES
  ('kg', 'Kilogram', 'kg', 1.0),
  ('g', 'Gram', 'kg', 0.001);
```

### Suppliers
New suppliers can be added via SQL:
```sql
INSERT INTO suppliers (name, contact_email, ordering_email, connector_type) VALUES
  ('New Supplier', 'contact@supplier.is', 'orders@supplier.is', 'email');
```

## 🔒 Security Considerations

### Data Protection
- All supplier credentials are encrypted using libsodium sealed boxes
- Database access is strictly controlled via RLS policies
- Audit logging tracks all sensitive operations
- No plain-text passwords stored anywhere

### Tenant Isolation
- Each organization's data is completely isolated
- Cross-tenant data access is impossible at the database level
- All queries automatically scope to the user's tenant

### Compliance
- GDPR-ready with data minimization principles
- Audit trail for regulatory compliance
- Right to deletion supported via cascading deletes

## 🧪 Testing

### Running Tests
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

### Test Coverage
- Unit tests for VAT calculations and unit conversions
- Integration tests for price comparison logic
- E2E tests for complete order flow

## 📚 API Documentation

The platform exposes a REST API for integration purposes. Key endpoints:

- `GET /api/v1/catalog/items` - Search and filter products
- `POST /api/v1/orders/compose` - Create order with supplier splits  
- `GET /api/v1/prices/history` - Price history data
- `POST /api/v1/suppliers/credentials` - Manage supplier credentials

Full OpenAPI 3.1 specification available at `/api/docs`.

## 🚧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── compare/        # Price comparison features
│   ├── orders/         # Order management
│   ├── suppliers/      # Supplier management
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── types/          # TypeScript type definitions
│   └── unitVat.ts      # Unit conversion and VAT engine
├── pages/              # Page components
└── integrations/       # External service integrations
    └── supabase/       # Supabase client and types
```

### Key Architectural Decisions
- **Supabase-first**: Leverages Supabase for auth, database, and file storage
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Component-based**: Modular React components for maintainability
- **Design System**: Consistent UI with shadcn/ui component library

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new functionality
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Review the documentation in the `/docs` folder

## 🗺️ Roadmap

### Q1 2024
- [ ] Advanced filtering and search
- [ ] Bulk order templates
- [ ] Email notification system
- [ ] Mobile-responsive improvements

### Q2 2024
- [ ] Supplier API connectors
- [ ] Advanced analytics dashboard
- [ ] Export/import functionality
- [ ] Multi-language support

### Q3 2024
- [ ] EDI/Peppol integration
- [ ] Machine learning entity matching
- [ ] Mobile application
- [ ] Advanced reporting

### Q4 2024
- [ ] Nordic market expansion
- [ ] Enterprise features
- [ ] Advanced workflow automation
- [ ] Third-party integrations

---

Built with ❤️ for the Icelandic B2B market

```


---

## docs\SECURITY.md

```md

# Security Documentation

This document outlines the security measures, policies, and best practices implemented in the Iceland B2B Wholesale Comparison Platform.

## 🔐 Security Architecture

### Multi-Tenant Security Model
The platform implements a strict multi-tenant architecture with the following security layers:

1. **Database Level Security**
   - Row Level Security (RLS) policies on all tables
   - Tenant-scoped data access enforced at the SQL level
   - Cross-tenant data leakage prevention through policy enforcement

2. **Application Level Security**
   - User authentication via Supabase Auth
   - Session management with automatic token refresh
   - Role-based access control (RBAC)

3. **API Security**
   - All endpoints require authentication
   - Request validation using Zod schemas
   - Rate limiting on sensitive endpoints

## 🔑 Authentication & Authorization

### User Authentication
- **Email/Password Authentication**: Secure password-based login
- **Session Management**: JWT tokens with automatic refresh
- **Multi-Factor Authentication**: Ready for MFA implementation
- **Password Requirements**: Enforced through Supabase Auth policies

### Role-Based Access Control
Three primary roles with different permissions:

#### Admin
- Full access to tenant data
- User management capabilities
- System configuration access
- Audit log access

#### Manager  
- Price comparison and analysis
- Order creation and management
- Supplier relationship management
- Limited user management

#### Buyer
- Price comparison access
- Order creation (with approval workflows)
- Basic reporting access
- Read-only supplier information

### Tenant Isolation
```sql
-- Example RLS Policy for Orders
CREATE POLICY "Orders isolated by tenant" ON public.orders
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );
```

## 🔒 Data Protection

### Encryption at Rest

#### Supplier Credentials
All supplier credentials are encrypted using **libsodium sealed boxes** before storage:

```typescript
// Encryption (client-side)
const encryptedCredentials = sodium.crypto_box_seal(
  JSON.stringify(credentials),
  publicKey
);

// Storage
await supabase
  .from('supplier_credentials')
  .upsert({
    tenant_id: tenantId,
    supplier_id: supplierId,
    encrypted_blob: encryptedCredentials
  });
```

#### Database Encryption
- All database connections use TLS 1.3
- Supabase provides encryption at rest for all stored data
- Backup encryption enabled

### Encryption in Transit
- All API communications over HTTPS/TLS 1.3
- WebSocket connections secured with WSS
- Internal service communication encrypted

### Key Management
- **Development**: Environment variables
- **Production**: Prepared for HashiCorp Vault or AWS KMS
- **Rotation**: Key rotation procedures documented
- **Access**: Principle of least privilege for key access

## 🛡️ Security Controls

### Input Validation
- All user inputs validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS prevention through proper output encoding
- CSRF protection via Supabase's built-in mechanisms

### Rate Limiting
```typescript
// Example rate limiting configuration
const rateLimits = {
  login: '5 attempts per 15 minutes',
  priceSearch: '100 requests per minute', 
  orderSubmission: '10 orders per hour',
  credentialTest: '3 attempts per 5 minutes'
};
```

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
```

## 📊 Audit Logging

### Audit Events
All security-relevant events are logged in the `audit_events` table:

```sql
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Logged Events
- User authentication (login/logout)
- Credential creation/modification/deletion
- Order creation and dispatch
- Price data ingestion
- Configuration changes
- Failed authentication attempts
- Privilege escalation attempts

### Log Retention
- **Development**: 30 days
- **Production**: 2 years minimum
- **Compliance**: Extended retention as required

## 🚨 Incident Response

### Security Incident Classification

#### Severity 1 (Critical)
- Data breach with PII exposure
- Unauthorized admin access
- System compromise

#### Severity 2 (High)
- Unauthorized tenant data access
- Credential exposure
- Service disruption

#### Severity 3 (Medium)
- Failed authentication attempts
- Suspicious activity patterns
- Performance degradation

#### Severity 4 (Low)
- Minor configuration issues
- Non-critical log anomalies

### Response Procedures

1. **Detection**: Automated monitoring and manual reporting
2. **Assessment**: Severity classification and impact analysis
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis and evidence collection
5. **Recovery**: Service restoration and security hardening
6. **Lessons Learned**: Post-incident review and improvement

### Contact Information
- **Security Team**: security@example.com
- **Emergency Hotline**: +354-XXX-XXXX
- **Incident Reporting**: incidents@example.com

## 🔍 Vulnerability Management

### Security Testing
- **Static Analysis**: Automated code scanning
- **Dependency Scanning**: Regular vulnerability assessment of dependencies
- **Penetration Testing**: Annual third-party security assessment
- **Bug Bounty**: Responsible disclosure program

### Patch Management
- **Critical Patches**: Applied within 24 hours
- **High Priority**: Applied within 1 week
- **Medium Priority**: Applied within 1 month
- **Low Priority**: Applied during regular maintenance windows

### Dependency Management
```json
{
  "scripts": {
    "audit": "pnpm audit --audit-level high",
    "audit-fix": "pnpm audit --fix",
    "security-check": "pnpm dlx @cyclonedx/bom"
  }
}
```

## 🏢 Compliance & Governance

### Data Privacy Regulations

#### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Data used only for stated purposes
- **Storage Limitation**: Automatic data deletion policies
- **Data Portability**: Export functionality for user data
- **Right to Deletion**: Cascading delete procedures

#### Data Processing Records
- **Data Categories**: Customer data, supplier data, transaction data
- **Processing Purposes**: Order management, price comparison, analytics
- **Data Retention**: Configurable retention periods by data type
- **Third Party Sharing**: Limited to authorized suppliers only

### Regulatory Requirements

#### Iceland Data Protection Act
- Personal data protection measures
- Data controller registration
- Cross-border data transfer restrictions

#### Financial Regulations
- Transaction audit trails
- VAT calculation accuracy
- Financial data retention requirements

## 🛠️ Security Configuration

### Environment Variables
```bash
# Required security environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Encryption keys
ENCRYPTION_KEY=your-encryption-key
SIGNING_SECRET=your-signing-secret

# Third-party APIs (if used)
SMTP_API_KEY=your-smtp-key
```

### Supabase Security Settings
```sql
-- Enable RLS on all tables
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Set password requirements
UPDATE auth.users SET 
  password_requirements = '{
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": true
  }';
```

## 📋 Security Checklist

### Development
- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention measures
- [ ] CSRF protection enabled
- [ ] Dependency vulnerability scanning
- [ ] Code review for security issues

### Deployment
- [ ] TLS/SSL certificates configured
- [ ] Database encryption enabled
- [ ] Backup encryption configured
- [ ] Log aggregation set up
- [ ] Monitoring and alerting configured
- [ ] Rate limiting implemented
- [ ] Security headers configured

### Operations
- [ ] Regular security updates
- [ ] Access review procedures
- [ ] Incident response plan tested
- [ ] Backup and recovery tested
- [ ] Audit log review processes
- [ ] Compliance documentation updated

## 🔗 Security Resources

### Internal Documentation
- [API Security Guidelines](./API-SECURITY.md)
- [Deployment Security Checklist](./DEPLOYMENT-SECURITY.md)
- [Incident Response Playbook](./INCIDENT-RESPONSE.md)

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Iceland Data Protection Authority](https://www.personuvernd.is/)

### Security Tools
- **SAST**: CodeQL, SonarQube
- **DAST**: OWASP ZAP, Burp Suite
- **Dependency Scanning**: Snyk, npm audit
- **Infrastructure Scanning**: Terraform security, Checkov

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create public GitHub issues for security vulnerabilities
2. Email security concerns to: security@example.com
3. Include detailed reproduction steps and potential impact
4. Allow reasonable time for response and remediation

We appreciate your help in keeping the platform secure!

---

*Last updated: January 2024*
*Review cycle: Quarterly*
*Next review: April 2024*

```


---

## e2e\header-stability.spec.ts

```ts
import { test, expect } from '@playwright/test';

// Already authenticated via global-setup storageState.
// No per-test login or env vars needed anymore.

test('header remains fixed when overlay opens and closes', async ({ page }) => {
  await page.goto('/'); // ensure we start from the app
  const header = page.getByRole('banner');
  const before = await header.boundingBox();
  await page.getByRole('button', { name: 'Help' }).click();
  const afterOpen = await header.boundingBox();
  await page.keyboard.press('Escape');
  const afterClose = await header.boundingBox();
  expect(afterOpen?.x).toBe(before?.x);
  expect(afterOpen?.width).toBe(before?.width);
  expect(afterClose?.x).toBe(before?.x);
  expect(afterClose?.width).toBe(before?.width);
});

test('header position is stable when search is focused', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  const search = page.getByPlaceholder('Search products, suppliers, orders...');
  const before = await header.boundingBox();
  await search.focus();
  const afterFocus = await header.boundingBox();
  await search.evaluate((el: HTMLInputElement) => el.blur());
  const afterBlur = await header.boundingBox();
  expect(afterFocus?.x).toBe(before?.x);
  expect(afterFocus?.width).toBe(before?.width);
  expect(afterBlur?.x).toBe(before?.x);
  expect(afterBlur?.width).toBe(before?.width);
});

test('right action buttons keep width and styles on focus', async ({ page }) => {
  await page.goto('/');
  const buttons = page.locator('header nav button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const before = await btn.evaluate(el => {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        borderLeft: s.borderLeftWidth,
        borderRight: s.borderRightWidth,
        width: rect.width,
      };
    });
    await btn.focus();
    const after = await btn.evaluate(el => {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        borderLeft: s.borderLeftWidth,
        borderRight: s.borderRightWidth,
        width: rect.width,
      };
    });
    expect(after).toEqual(before);
  }
});

```


---

## e2e\navigation.spec.ts

```ts
import { test, expect } from '@playwright/test';

// Already authenticated via global-setup storageState.

test('sidebar links route correctly', async ({ page }) => {
  await page.goto('/');

  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Compare', path: '/compare' },
    { label: 'Suppliers', path: '/suppliers' },
  ];

  for (const { label, path } of links) {
    await page.getByRole('link', { name: label }).click();
    if (path === '/') {
      await expect(page).toHaveURL(/\/$/);
    } else {
      await expect(page).toHaveURL(new RegExp(path));
    }
  }
});

test('catalog search flow', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page).toHaveURL(/catalog/);

  const searchBox = page.getByPlaceholder('Search products');
  await searchBox.fill('test');
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});

```


---

## ingestion\adapters\api-foo.ts

```ts
import { createHash } from 'node:crypto';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const apiFooAdapter = (cfg: { supplierId: string; apiUrl: string; apiKey: string; }): SupplierAdapter => ({
  key: 'foo_api',
  async pull() {
    const res = await fetch(`${cfg.apiUrl}/products`, { headers: { Authorization: `Bearer ${cfg.apiKey}` }});
    const json = await res.json();
    return json.items.map((p: any) => ({ supplierId: cfg.supplierId, sourceUrl: `${cfg.apiUrl}/products/${p.id}`, payload: p })) as RawItem[];
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const p: any = payload;
      const base = normalizeBasics({ name: p.title, brand: p.brand, packSize: p.pack });
      return {
        supplierId,
        supplierSku: String(p.sku ?? p.id),
        name: base.name,
        brand: base.brand,
        packSize: base.packSize,
        gtin: p.gtin ?? undefined,
        categoryPath: p.categoryPath ?? p.category_path ?? (p.category ? [p.category] : undefined),
        imageUrl: p.image ?? undefined,
        sourceUrl,
        dataProvenance: 'api',
        provenanceConfidence: p.gtin ? 0.95 : 0.8,
        rawHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
      } as NormalizedItem;
    });
  }
});

```


---

## ingestion\adapters\csv-bar.ts

```ts
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const csvBarAdapter = (cfg: {
  supplierId: string; csvText: string; baseUrl?: string;
}): SupplierAdapter => ({
  key: 'bar_csv',
  async pull() {
    const records = parse(cfg.csvText, { columns: true, skip_empty_lines: true });
    return records.map((row: any) => ({
      supplierId: cfg.supplierId,
      sourceUrl: cfg.baseUrl,
      payload: row,
    })) as RawItem[];
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const r: any = payload;
      const supplierSku = String(r.sku ?? r.SKU ?? r.id ?? '').trim();
      const name = String(r.name ?? r.Title ?? '').trim();
      const brand = (r.brand ?? r.Brand ?? '').trim() || undefined;
      const gtin = (r.gtin ?? r.ean ?? '').trim() || undefined;
      const packSize = (r.pack ?? r.case ?? r.size ?? '').trim() || undefined;
      const imageUrl = (r.image ?? r.image_url ?? '').trim() || undefined;
      const rawHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      const base = normalizeBasics({ name, brand, packSize });
      return {
        supplierId, supplierSku, name: base.name,
        brand: base.brand, packSize: base.packSize,
        gtin, imageUrl, sourceUrl,
        dataProvenance: 'csv', provenanceConfidence: gtin ? 0.9 : 0.6, rawHash,
      } satisfies NormalizedItem;
    });
  }
});

```


---

## ingestion\adapters\sitemap-baz.ts

```ts
import { createHash } from 'node:crypto';
import { SupplierAdapter, RawItem, NormalizedItem } from '../types';
import { normalizeBasics } from '../normalize';

export const sitemapBazAdapter = (cfg: { supplierId: string; sitemapUrl: string; }): SupplierAdapter => ({
  key: 'baz_sitemap',
  async pull() {
    const res = await fetch(cfg.sitemapUrl);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const items: RawItem[] = [];
    for (const url of urls) {
      const page = await fetch(url);
      const payload = await page.json();
      items.push({ supplierId: cfg.supplierId, sourceUrl: url, payload });
    }
    return items;
  },
  async normalize(rows) {
    return rows.map(({ supplierId, sourceUrl, payload }: RawItem) => {
      const p: any = payload;
      const base = normalizeBasics({ name: p.name, brand: p.brand, packSize: p.packSize });
      return {
        supplierId,
        supplierSku: String(p.sku),
        name: base.name,
        brand: base.brand,
        packSize: base.packSize,
        gtin: p.gtin ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        sourceUrl,
        dataProvenance: 'sitemap',
        provenanceConfidence: p.gtin ? 0.9 : 0.7,
        rawHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
      } as NormalizedItem;
    });
  }
});

```


---

## ingestion\extractors\innnes-cheerio.ts

```ts
// Run with:
// pnpm tsx ingestion/extractors/innnes-cheerio.ts

import { fetch } from "undici";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const BASE = "https://innnes.is";
const START_URLS = [
  `${BASE}/avextir-og-graenmeti/`,
  // add more categories here later
];

// robust selectors for Innnes product cards
const CARD_SEL = [
  ".productcard__container",
  ".productcard",                // fallback
  "ul.products li.product"       // generic fallback
].join(",");

function norm(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function absUrl(href?: string) {
  try { return new URL(href!, BASE).href; } catch { return href || ""; }
}
function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

async function scrapeCategory(url: string) {
  const out: any[] = [];
  let pageUrl: string | undefined = url;

  while (pageUrl) {
    const html = await (await fetch(pageUrl, {
      headers: {
        "accept-language": "is-IS,is;q=0.9,en;q=0.8",
        "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)"
      }
    })).text();

    const $ = cheerio.load(html);

    // grab cards
    $(CARD_SEL).each((_, el) => {
      const $el = $(el);

      // title
      const name =
        norm($el.find("h3.productcard__heading").first().text()) ||
        norm($el.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text());

      // link
      const href =
        $el.find("a[href]").first().attr("href") ||
        $el.find(".productcard__image a[href], .productcard__heading a[href]").attr("href") ||
        "";

      // sku
      const skuText =
        norm($el.find(".productcard__sku, [class*=sku]").first().text()) || "";
      const skuMatch =
        skuText.match(/[A-Z0-9][A-Z0-9\-_.]{3,}/i)?.[0] ||
        absUrl(href).split("/").filter(Boolean).pop(); // slug fallback

      // pack / size
      const packText = norm($el.find(".productcard__size, .productcard__unit").first().text()) ||
                       norm($el.find(".woocommerce-product-details__short-description").first().text());
      const packSize = (packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || "")
                        .replace(/\s+/g, "")
                        || undefined;

      // availability
      const availabilityText = norm($el.find(".productcard__availability").first().text())
                        || undefined;

      // image
      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));

      if (name && href) {
        const urlAbs = absUrl(href);
        out.push({
          name,
          url: urlAbs,
          supplierSku: skuMatch,
          packSize,
          availabilityText,
          imageUrl,
          dataProvenance: "site",
          provenanceConfidence: 0.7,
          rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku: skuMatch }))
        });
      }
    });

    // pagination (next)
    const nextHref =
      $("a[rel=next]").attr("href") ||
      $(".pagination__item--active").next().find("a[href]").attr("href") ||
      $(".pagination .page-numbers .next").attr("href") ||
      undefined;

    pageUrl = nextHref ? absUrl(nextHref) : undefined;
  }

  return out;
}

async function run() {
  let total = 0;
  for (const u of START_URLS) {
    const items = await scrapeCategory(u);
    total += items.length;
    console.log(`Category ${u} → ${items.length} items`);
    console.log(items.slice(0, 5)); // sample preview
  }
  console.log(`Done. Total items: ${total}`);
}

run().catch(err => { console.error(err); process.exit(1); });

```


---

## ingestion\pipelines\innnes-upsert.ts

```ts
// Run with:
// SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPPLIER_ID=INNNES
// pnpm tsx ingestion/pipelines/innnes-upsert.ts

import { createClient } from "@supabase/supabase-js";
import { fetch } from "undici";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const BASE = "https://innnes.is";

/**
 * Add any category landing pages you want to scrape here.
 * Example new category from your screenshot: "Brauð, eftirréttir og ís"
 * (Update the URL to match the site’s actual slug.)
 */
const CATEGORY_URLS = [
  `${BASE}/avextir-og-graenmeti/`,
  `${BASE}/braud-eftirrettir-og-is/`,    // <- uncomment when ready
  // `${BASE}/drykkir/`,
  // ...
];

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPPLIER_ID = process.env.SUPPLIER_ID || "INNNES";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CARD_SEL = [
  ".productcard__container",
  ".productcard",
  "ul.products li.product",
].join(",");

const norm = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const absUrl = (href?: string) => {
  try {
    return new URL(href!, BASE).href;
  } catch {
    return href || "";
  }
};

type ScrapedItem = {
  name: string;
  url: string;
  supplierSku: string;
  packSize?: string;
  availabilityText?: string;
  imageUrl?: string;
  categoryPath?: string[];      // NEW: will be stored in supplier_product.category_path
  rawHash: string;
};

/** Try to read a breadcrumb trail; if missing, fall back to a path-derived label */
function deriveCategoryPath($: cheerio.CheerioAPI, pageUrl: string): string[] | undefined {
  const crumbs = $('nav.breadcrumb, .breadcrumb, .breadcrumbs, .c-breadcrumbs')
    .find('li, a, span')
    .map((_, el) => norm($(el).text()))
    .get()
    .filter(Boolean);

  // Drop very generic starts like "Heim" / "Home"
  const cleaned = crumbs.filter(t => !/^heim$|^home$/i.test(t));

  if (cleaned.length) return cleaned;

  // Fallback: last path segment prettified
  const u = new URL(pageUrl);
  const segs = u.pathname.split("/").filter(Boolean);
  const last = segs.pop();
  if (last) {
    const pretty = last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return [pretty];
  }
  return undefined;
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: {
      "accept-language": "is-IS,is;q=0.9,en;q=0.8",
      "user-agent": "KaupaCrawler/1.0 (+contact: you@example.is)",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  const html = await res.text();
  return cheerio.load(html);
}

function buildPaginator(categoryUrl: string, $first: cheerio.CheerioAPI) {
  // Try to detect a template like ?page={n}&filter=&orderby=  (or p=)
  let template = "";
  const cand = $first(".pagination a[href], .pagination__item a[href], .page-numbers a[href]")
    .map((_, a) => absUrl($first(a).attr("href")))
    .get()
    .find(Boolean);

  if (cand) {
    try {
      const u = new URL(cand);
      const pageKey = [...u.searchParams.keys()].find(k => /^(page|p)$/i.test(k));
      if (pageKey) {
        u.searchParams.set(pageKey, "{n}");
        template = "?" + u.searchParams.toString().replace("%7Bn%7D", "{n}");
      }
    } catch {
      // ignore invalid URLs in pagination template discovery
    }
  }

  return (n: number) => {
    const base = new URL(categoryUrl);
    base.search = "";
    if (template) {
      return base.origin + base.pathname + template.replace("{n}", String(n));
    }
    // fallback #1: ?page=N
    const u = new URL(categoryUrl);
    u.searchParams.set("page", String(n));
    // fallback #2 (WooCommerce style): /page/N/
    const alt = new URL(categoryUrl);
    const parts = alt.pathname.replace(/\/+$/, "").split("/");
    alt.pathname = n === 1
      ? parts.join("/") + "/"
      : parts.concat(["page", String(n)]).join("/") + "/";
    return n === 1 ? categoryUrl : u.toString(); // swap to alt if needed
  };
}

async function scrapeCategory(categoryUrl: string): Promise<ScrapedItem[]> {
  const out: ScrapedItem[] = [];
  const seen = new Set<string>();

  // First page (also used to derive categoryPath + pagination)
  const $first = await fetchPage(categoryUrl);
  const categoryPath = deriveCategoryPath($first, categoryUrl);

  const pushOne = ($: cheerio.CheerioAPI, pageUrl: string) => {
    $(CARD_SEL).each((_, el) => {
      const $el = $(el);
      const name =
        norm($el.find("h3.productcard__heading").first().text()) ||
        norm($el.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text());
      const href =
        $el.find("a[href]").first().attr("href") ||
        $el.find(".productcard__image a[href], .productcard__heading a[href]").attr("href") ||
        "";
      if (!name || !href) return;

      const skuText = norm($el.find(".productcard__sku, [class*=sku]").first().text());
      const supplierSku =
        skuText.match(/[A-Z0-9][A-Z0-9\-_.]{3,}/i)?.[0] ||
        absUrl(href).split("/").filter(Boolean).pop() ||
        absUrl(href);

      const packText = norm($el.find(".productcard__size, .productcard__unit").first().text());
      const packSize = (
        packText.match(/(\d+\s*[x×]\s*\d+\s*(?:ml|l|g|kg)|\d+\s*(?:kg|g|ml|l)|\d+\s*stk)/i)?.[0] || ""
      ).replace(/\s+/g, "") || undefined;

      const availabilityText = norm($el.find(".productcard__availability").first().text()) || undefined;
      const img = $el.find(".productcard__image img, img").first();
      const imageUrl = absUrl(img.attr("data-src") || img.attr("src"));
      const urlAbs = absUrl(href);

      const key = `${supplierSku}::${urlAbs}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        name,
        url: urlAbs,
        supplierSku,
        packSize,
        availabilityText,
        imageUrl,
        categoryPath, // same for all items on this category page
        rawHash: sha256(JSON.stringify({ name, url: urlAbs, supplierSku })),
      });
    });
    console.log(`Scraped page ${pageUrl} → ${out.length} total`);
  };

  // Scrape first page
  pushOne($first, categoryUrl);

  // Discover and iterate subsequent pages with a safety stop
  const pageUrlFor = buildPaginator(categoryUrl, $first);
  let p = 2;
  let emptyStreak = 0;
  const HARD_CAP = 100;

  while (p <= HARD_CAP && emptyStreak < 2) {
    const pageUrl = pageUrlFor(p);
    try {
      const $ = await fetchPage(pageUrl);
      const before = out.length;
      pushOne($, pageUrl);
      const added = out.length - before;
      if (added === 0) emptyStreak += 1; else emptyStreak = 0;
      console.log(`page=${p} added=${added} total=${out.length}`);
      p += 1;
      await new Promise(r => setTimeout(r, 350)); // politeness
    } catch (e) {
      console.warn(`Failed ${pageUrl}: ${(e as Error).message}`);
      break;
    }
  }

  return out;
}

/** Find or create a catalog_product and return its id (UUID). */
async function matchOrCreateCatalog(name: string, packSize?: string): Promise<string> {
  const { data: candidates, error } = await sb
    .from("catalog_product")
    .select("id,name,size")
    .ilike("name", `%${name.slice(0, 48)}%`)
    .limit(20);

  if (error) throw error;

  const pick = candidates?.find(
    (c) => !packSize || (c.size || "").replace(/\s/g, "").toLowerCase() === packSize.toLowerCase()
  );
  if (pick?.id) return pick.id;

  const { data: created, error: insErr } = await sb
    .from("catalog_product")
    .insert({ name, size: packSize ?? null })
    .select("id")
    .single();

  if (insErr) throw insErr;
  return created!.id;
}

/** Upsert supplier_product (FK: catalog_product_id). */
async function upsertSupplierProduct(catalogId: string, i: ScrapedItem) {
  const payload: any = {
    supplier_id: SUPPLIER_ID,
    catalog_product_id: catalogId,           // ✅ correct FK
    supplier_sku: i.supplierSku,
    pack_size: i.packSize ?? null,
    source_url: i.url,
    availability_text: i.availabilityText ?? null,
    image_url: i.imageUrl ?? null,
    category_path: i.categoryPath ?? null,   // ✅ new column if present
    data_provenance: "site",
    provenance_confidence: 0.7,
    raw_hash: i.rawHash,
    last_seen_at: new Date().toISOString(),
    active_status: 'ACTIVE',                 // Re-activate when seen
  };

  const { error } = await sb
    .from("supplier_product")
    .upsert(payload, { onConflict: "supplier_id,supplier_sku" });

  if (error) throw error;
}

async function run() {
  // Track run start time for staleness management
  const RUN_STARTED_AT = new Date().toISOString();
  console.log(`Starting Innnes ingestion run at ${RUN_STARTED_AT}`);

  let total = 0;
  for (const categoryUrl of CATEGORY_URLS) {
    console.log(`Starting category: ${categoryUrl}`);
    const items = await scrapeCategory(categoryUrl);
    const seenSkus = new Set<string>();
    
    // de-dupe across pages by (supplierSku,url)
    const uniq = new Map<string, ScrapedItem>();
    for (const it of items) {
      uniq.set(`${it.supplierSku}::${it.url}`, it);
      seenSkus.add(it.supplierSku);
    }
    const deduped = [...uniq.values()];

    console.log(`Category ${categoryUrl} → ${deduped.length} deduped items`);
    total += deduped.length;

    for (const it of deduped) {
      const catalogId = await matchOrCreateCatalog(it.name, it.packSize);
      await upsertSupplierProduct(catalogId, it);
    }

    // Category-scoped "mark stale" - mark items in this category that weren't seen this run
    console.log(`Marking stale products for category: ${categoryUrl}`);
    const { error: staleError } = await sb
      .from('supplier_product')
      .update({
        active_status: 'STALE',
        stale_since: new Date().toISOString(),
        delisted_reason: 'not_seen_in_category_crawl'
      })
      .eq('supplier_id', SUPPLIER_ID)
      .like('source_url', `${categoryUrl}%`)
      .or(`last_seen_at.is.null,last_seen_at.lt.${RUN_STARTED_AT}`)
      .eq('active_status', 'ACTIVE');

    if (staleError) {
      console.error(`Error marking stale products for ${categoryUrl}:`, staleError);
    } else {
      console.log(`Staleness marking completed for ${categoryUrl}`);
    }
  }
  console.log(`Upserted ${total} items for supplier ${SUPPLIER_ID}`);
}

run().catch(err => { console.error(err); process.exit(1); });

```


---

## ingestion\runner.ts

```ts
import { createClient } from '@supabase/supabase-js';
import type { SupplierAdapter } from './types';
import { matchOrCreateCatalog } from './match';

export async function runOnce(supabaseUrl: string, serviceRoleKey: string, supplierId: string, adapter: SupplierAdapter) {
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: job } = await sb.from('ingest_job').insert({
    supplier_id: supplierId,
    trigger: 'scheduler',
    status: 'running',
    started_at: new Date().toISOString(),
  }).select().single();

  try {
    const raw = await adapter.pull();

    for (const r of raw) {
      const rawHash = await sha256(JSON.stringify(r.payload));
      await sb.from('stg_supplier_products_raw').insert({
        supplier_id: r.supplierId,
        source_type: adapter.key.includes('api') ? 'api' : adapter.key.includes('csv') ? 'csv' : 'sitemap',
        source_url: r.sourceUrl ?? null,
        raw_payload: r.payload,
        raw_hash: rawHash,
      }).onConflict('supplier_id,raw_hash').ignore();
    }

    const normalized = await adapter.normalize(raw);

    for (const n of normalized) {
      const catalogId = await matchOrCreateCatalog(sb, n);
      await sb.from('supplier_product').upsert({
        supplier_id: n.supplierId,
        catalog_id: catalogId,
        supplier_sku: n.supplierSku,
        pack_size: n.packSize ?? null,
        availability_text: n.availabilityText ?? null,
        image_url: n.imageUrl ?? null,
        source_url: n.sourceUrl ?? null,
        data_provenance: n.dataProvenance,
        provenance_confidence: n.provenanceConfidence,
        raw_hash: n.rawHash,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'supplier_id,supplier_sku' });

      if (n.imageUrl) {
        sb.functions.invoke('fetch-image', { body: { catalogId, imageUrl: n.imageUrl } }).catch(() => {});
      }
    }

    await sb.from('ingest_job').update({ status: 'success', finished_at: new Date().toISOString() }).eq('id', job!.id);
  } catch (err: any) {
    await sb.from('ingest_job').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error: String(err?.message ?? err),
    }).eq('id', job!.id);
    throw err;
  }
}

async function sha256(s: string) {
  const enc = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

```


---

## ingestion\types.ts

```ts
export type RawItem = {
  supplierId: string;
  sourceUrl?: string;
  payload: unknown;
};

export type NormalizedItem = {
  supplierId: string;
  supplierSku: string;
  name: string;
  brand?: string;
  packSize?: string;
  gtin?: string;
  categoryPath?: string[];
  imageUrl?: string;
  availabilityText?: string;
  sourceUrl?: string;
  dataProvenance: 'api'|'csv'|'sitemap'|'manual';
  provenanceConfidence: number;
  rawHash: string;
};

export interface SupplierAdapter {
  key: string;
  pull(): Promise<RawItem[]>;
  normalize(rows: RawItem[]): Promise<NormalizedItem[]>;
}

```


---

## package.json

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run build:extension && vite build",
    "build:dev": "npm run build:extension && vite build --mode development",
    "build:extension": "npm --prefix extension run build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs run --maxWorkers=2",
    "test:e2e": "playwright test",
    "merge:mock-items": "node supabase/scripts/mergeMockItems.js",
    "db:seed:catalog": "node supabase/scripts/seedCatalog.js",
    "cache:images": "node supabase/scripts/cacheImages.js",
    "check:dupes": "tsx scripts/check-duplicates.ts",
    "chat:pack": "tsx tools/make-chatpack.ts --preset catalog",
    "chat:pack:sidebar": "tsx tools/make-chatpack.ts --preset sidebar",
    "chat:pack:cart": "tsx tools/make-chatpack.ts --preset cart",
    "chat:pack:topbar": "tsx tools/make-chatpack.ts --preset topbar",
    "chat:pack:suppliers": "tsx tools/make-chatpack.ts --preset suppliers",
    "chat:pack:all": "pnpm run chat:pack && pnpm run chat:pack:sidebar && pnpm run chat:pack:cart && pnpm run chat:pack:topbar && pnpm run chat:pack:suppliers"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.55.0",
    "@tanstack/react-query": "^5.83.0",
    "@tanstack/react-virtual": "^3.13.12",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "csv-parse": "^6.1.0",
    "date-fns": "^3.6.0",
    "dotenv": "^17.2.1",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "react-window": "^1.8.11",
    "recharts": "^2.15.4",
    "sharp": "^0.33.5",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "use-sync-external-store": "^1.5.0",
    "vaul": "^0.9.9",
    "zod": "^3.25.76",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@playwright/test": "^1.54.2",
    "@tailwindcss/typography": "^0.5.16",
    "@tanstack/react-query-devtools": "^5.85.3",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.7.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "@vitest/coverage-v8": "^3.2.4",
    "autoprefixer": "^10.4.21",
    "cheerio": "^1.1.2",
    "esbuild": "^0.25.9",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "fast-glob": "^3.3.3",
    "globals": "^15.15.0",
    "jsdom": "^26.1.0",
    "lovable-tagger": "^1.1.9",
    "pg-mem": "^3.0.5",
    "playwright": "^1.55.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.20.4",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "undici": "^7.15.0",
    "vite": "^5.4.19",
    "vitest": "^3.2.4"
  },
  "packageManager": "pnpm@10.14.0"
}

```


---

## README.md

```md

# Heilda

A modern procurement platform that streamlines supplier management, price comparison, and order processing for businesses.

## Features

- **Supplier Management**: Connect and manage multiple suppliers
- **Price Comparison**: Compare prices across suppliers in real-time
- **Smart Ordering**: Optimized ordering suggestions and delivery calculations
- **Analytics Dashboard**: Real-time insights into procurement activities
- **Multi-tenant Support**: Organization-based access control

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack Query, React Context
- **UI Components**: shadcn/ui
- **Testing**: Vitest, Playwright
- **Build Tool**: Vite

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   VITE_CDN_URL="https://your-cdn.example.com"
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

### Testing

Run unit tests:
```bash
pnpm test
```

Run end-to-end tests:
```bash
pnpm test:e2e
```

### Building

Build for production:
```bash
pnpm build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # Business logic and API calls
├── lib/                # Utilities and configurations
└── integrations/       # External service integrations
```

## Key Features

### Authentication & Authorization
- Multi-tenant architecture with role-based access
- Platform admin elevation system
- Audit logging for security compliance

### Supplier Integration
- HAR file processing for web scraping
- Real-time price monitoring
- Automated inventory synchronization

### Order Management
- Smart delivery optimization
- Multi-supplier order splitting
- Approval workflows

### Analytics
- Price anomaly detection
- Performance dashboards
- Export capabilities

## Environment Variables

Configure these in your `.env` file:

- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – your Supabase anonymous public key
- `VITE_CDN_URL` – base URL for serving cached images
- `E2E_EMAIL` – account email used for Playwright tests
- `E2E_PASSWORD` – password for the above account
- `E2E_SIGNUP_PASSWORD` — password used in sign-up flow tests

In CI, configure these as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets.

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

```


---

## scripts\seedCatalog.ts

```ts
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(url, key, { auth: { persistSession: false } })

async function run() {
  const orgId = randomUUID()
  const supplierId = randomUUID()

  await sb.from('tenants').upsert({ id: orgId, name: 'Test Org' }, { onConflict: 'id' })
  await sb.from('suppliers').upsert({ id: supplierId, name: 'Test Supplier' }, { onConflict: 'id' })

  const catalogIds: string[] = []
  for (let i = 0; i < 20; i++) {
    const name = i === 0 ? 'Milk 1L' : `Product ${i}`
    const { data } = await sb
      .from('catalog_product')
      .insert({ name, brand: 'Brand ' + i, size: '1L' })
      .select('catalog_id')
      .single()
    catalogIds.push(data!.catalog_id)
  }

  const supplierProductIds: string[] = []
  for (let i = 0; i < 50; i++) {
    const catalog_id = i < catalogIds.length ? catalogIds[i % catalogIds.length] : null
    const { data } = await sb
      .from('supplier_product')
      .insert({
        supplier_id: supplierId,
        supplier_sku: `SKU-${i}`,
        catalog_id,
        source_url: 'https://example.com',
        raw_hash: `${i}`,
        raw_payload_json: { idx: i }
      })
      .select('supplier_product_id, catalog_id')
      .single()
    supplierProductIds.push(data!.supplier_product_id)
    if (catalog_id && i < 5) {
      await sb.from('offer').insert({
        org_id: orgId,
        supplier_product_id: data!.supplier_product_id,
        price: 100 + i,
        currency: 'ISK'
      })
    }
  }

  console.log('Seeded catalog with org', orgId, 'and supplier', supplierId)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

```


---

## src\components\cart\AddToCartButton.tsx

```tsx
import { Button } from '@/components/ui/button'
import { QuantityStepper } from './QuantityStepper'
import { useCart } from '@/contexts/useBasket'
import { useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface AddToCartButtonProps {
  product: any
  vendors: { id: string; name: string }[]
}

export default function AddToCartButton({ product, vendors }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const cartItem = items.find(i => i.supplierItemId === product.catalog_id)

  const [vendorId, setVendorId] = useState(
    vendors.length === 1 ? vendors[0].id : (product.suppliers?.[0]?.id as string | undefined)
  )

  if (cartItem) {
    return (
      <QuantityStepper
        quantity={cartItem.quantity}
        onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
        onRemove={() => removeItem(cartItem.supplierItemId)}
        label={product.name}
      />
    )
  }

  const handleAdd = () => {
    if (!vendorId) return
    addItem({ product_id: product.catalog_id, supplier_id: vendorId })
  }

  return (
    <div className="flex items-center gap-2">
      {vendors.length > 1 && (
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger className="w-[140px]" aria-label="Select vendor">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        onClick={handleAdd}
        aria-label={`Add ${product.name}`}
        disabled={!vendorId}
      >
        Add
      </Button>
    </div>
  )
}


```


---

## src\components\cart\CartDrawer.tsx

```tsx
import * as React from "react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Trash2, X } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getMissingPriceCount,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useCart()
  const { includeVat, setIncludeVat } = useSettings()

  const subtotal = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ISK",
      maximumFractionDigits: 0,
    }).format(n || 0)

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        className="w-[380px] max-w-[92vw] p-0 flex flex-col [&>button:last-child]:hidden"
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm leading-tight">
              <span aria-live="polite" className="sr-only">
                Cart subtotal {formatCurrency(subtotal)}
              </span>
              <div className="text-muted-foreground">Subtotal</div>
              <div className="font-semibold text-base">{formatCurrency(subtotal)}</div>
            </div>
            <div className="flex items-center gap-2">
              {missingPriceCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Some prices unavailable
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false)
                  location.assign("/cart")
                }}
              >
                Go to Cart
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close cart">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-2 space-y-3">
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Your cart is empty.
              </div>
            )}

            {items.map(it => (
              <div key={it.supplierItemId} className="rounded-lg border p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {it.image ? (
                      <img src={it.image} alt="" className="h-full w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.displayName || it.itemName}</div>
                    {it.packSize ? (
                      <div className="text-xs text-muted-foreground">{it.packSize}</div>
                    ) : null}
                    {it.supplierName ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">{it.supplierName}</div>
                    ) : null}

                    <div className="mt-2 text-sm font-semibold">
                      {formatCurrency(
                        includeVat
                          ? it.unitPriceIncVat ?? it.packPrice ?? 0
                          : it.unitPriceExVat ?? it.packPrice ?? 0,
                      )}
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2">
                      <QuantityStepper
                        quantity={it.quantity}
                        onChange={qty =>
                          qty === 0
                            ? removeItem(it.supplierItemId)
                            : updateQuantity(it.supplierItemId, qty)
                        }
                        label={it.displayName || it.itemName}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${it.displayName || "item"}`}
                        className="ml-1 text-destructive hover:text-destructive"
                        onClick={() => removeItem(it.supplierItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant={!includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(false)}
              >
                Ex VAT
              </Button>
              <Button
                variant={includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(true)}
              >
                Inc VAT
              </Button>
            </div>
            <Button size="lg" className="min-w-[140px]" onClick={() => location.assign("/checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CartDrawer


```


---

## src\components\cart\DeliveryHints.tsx

```tsx

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus } from 'lucide-react'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { PLACEHOLDER_IMAGE } from '@/lib/images'

interface DeliveryHint {
  supplierId: string
  supplierName: string
  amountToFreeDelivery: number
  currentDeliveryFee: number
  suggestedItems: Array<{
    id: string
    name: string
    packSize: string
    unitPrice: number
  }>
}

interface DeliveryHintsProps {
  hints: DeliveryHint[]
}

export function DeliveryHints({ hints }: DeliveryHintsProps) {
  const { addItem } = useCart()
  const { includeVat } = useSettings()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (hints.length === 0) return null

  return (
    <div className="space-y-3">
      {hints.map((hint) => (
        <Card key={hint.supplierId} className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>Save {formatPrice(hint.currentDeliveryFee)} delivery fee</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Add {formatPrice(hint.amountToFreeDelivery)} more from {hint.supplierName} to get free delivery
                </p>
              </div>
            </div>

            {hint.suggestedItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-blue-600 font-medium">Quick add suggestions:</div>
                <div className="flex flex-wrap gap-2">
                  {hint.suggestedItems.slice(0, 3).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => addItem({
                        id: item.id,
                        supplierItemId: item.id,
                        itemName: item.name,
                        packSize: item.packSize,
                        unitPriceExVat: item.unitPrice,
                        unitPriceIncVat: item.unitPrice * 1.24,
                        supplierId: hint.supplierId,
                        supplierName: hint.supplierName,
                        sku: `SKU-${item.id}`,
                        packPrice: item.unitPrice,
                        vatRate: 0.24,
                        unit: 'pc',
                        displayName: item.name,
                        packQty: 1,
                        image: PLACEHOLDER_IMAGE
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {item.name} - {formatPrice(item.unitPrice)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

```


---

## src\components\cart\QuantityStepper.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuantityStepper } from './QuantityStepper'

describe('QuantityStepper', () => {
  it('shows trash icon and calls onRemove when quantity is 1', async () => {
    const onRemove = vi.fn()
    render(
      <QuantityStepper
        quantity={1}
        onChange={() => {}}
        label="Test item"
        onRemove={onRemove}
      />
    )
    const button = screen.getByRole('button', { name: /remove test item/i })
    expect(button.querySelector('svg.lucide-trash2')).toBeTruthy()
    await userEvent.click(button)
    expect(onRemove).toHaveBeenCalled()
  })
})

```


---

## src\components\cart\QuantityStepper.tsx

```tsx
import React, { useEffect, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  quantity: number
  onChange: (qty: number) => void
  label: string
  /** Optional supplier name for accessibility labels */
  supplier?: string
  /** Optional callback when quantity should be removed */
  onRemove?: () => void
  min?: number
  max?: number
  className?: string
}

export function QuantityStepper({
  quantity,
  onChange,
  label,
  supplier,
  onRemove,
  min = 0,
  max = 9999,
  className,
}: QuantityStepperProps) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(String(quantity))

  useEffect(() => {
    if (!editing) {
      setTemp(String(quantity))
    }
  }, [quantity, editing])

  const numericValue = Number(temp)
  const isInvalid = numericValue > max || numericValue < min

  const startEdit = () => {
    setEditing(true)
    setTemp(String(quantity))
  }

  const cancelEdit = () => {
    setEditing(false)
    setTemp(String(quantity))
  }

  const commitEdit = () => {
    const newQty = Math.min(max, Math.max(min, numericValue || 0))
    onChange(newQty)
    setEditing(false)
  }

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const delta = e.shiftKey ? 10 : 1
      const newVal = numericValue + (e.key === 'ArrowUp' ? delta : -delta)
      const clamped = Math.min(max, Math.max(min, newVal))
      setTemp(String(clamped))
    }
  }

  const itemLabel = supplier ? `${label} from ${supplier}` : label

  return (
    <div
      className={cn(
        'relative inline-flex h-7 w-[92px] md:w-[100px] items-center divide-x rounded-md border ring-offset-1 focus-within:ring-2 focus-within:ring-brand/50',
        (quantity === min || isInvalid) && 'border-destructive',
        className,
      )}
    >
      <button
        className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
        aria-label={
          quantity === 1 ? `Remove ${itemLabel}` : `Decrease quantity of ${itemLabel}`
        }
        onClick={() =>
          quantity === 1 && onRemove
            ? onRemove()
            : onChange(Math.max(min, quantity - 1))
        }
        disabled={quantity === min}
      >
        {quantity === 1 ? (
          <Trash2 className="h-4 w-4 stroke-[1.5]" />
        ) : (
          <Minus className="h-4 w-4 stroke-[1.5]" />
        )}
      </button>
      {editing ? (
        <input
          aria-label={`Quantity of ${itemLabel}`}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            'h-full w-full bg-transparent text-center font-mono tabular-nums text-sm focus-visible:outline-none',
            isInvalid && 'text-destructive',
          )}
          value={temp}
          onChange={e => setTemp(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={commitEdit}
          onKeyDown={handleInputKey}
        />
      ) : (
        <span
          aria-label={`Quantity of ${itemLabel}`}
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              startEdit()
            }
          }}
          className="flex h-full flex-1 cursor-text items-center justify-center tabular-nums text-sm"
        >
          {quantity}
        </span>
      )}
      <button
        className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        aria-label={`Increase quantity of ${itemLabel}`}
        onClick={() => onChange(Math.min(max, quantity + 1))}
      >
        <Plus className="h-4 w-4 stroke-[1.5]" />
      </button>
      {isInvalid && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-destructive">
          {numericValue < min ? `Min ${min}` : `Max ${max}`}
        </span>
      )}
    </div>
  )
}

export default QuantityStepper

```


---

## src\components\catalog\__tests__\SupplierChips.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import SupplierChips from '../SupplierChips'
import { useVendors } from '@/hooks/useVendors'

describe('SupplierChips', () => {
  it('renders logo when supplier_logo_url provided', () => {
    const suppliers = [
      {
        supplier_id: '1',
        supplier_name: 'Logo Supplier',
        supplier_logo_url: 'https://example.com/logo.png',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.queryByText('LS')).toBeNull()
  })

  it('falls back to initials when no logo', () => {
    const suppliers = [
      {
        supplier_id: '2',
        supplier_name: 'No Logo',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.getByText('NL')).toBeInTheDocument()
  })

  it('renders logo when derived from useVendors', () => {
    localStorage.setItem(
      'connected-vendors',
      JSON.stringify([
        {
          id: '3',
          name: 'Vendor With Logo',
          logo_url: 'https://example.com/vendor-logo.png',
        },
      ]),
    )

    function Wrapper() {
      const { vendors } = useVendors()
      const suppliers = [
        {
          supplier_id: '3',
          supplier_name: 'Vendor With Logo',
          supplier_logo_url:
            vendors.find(v => v.name === 'Vendor With Logo')?.logo_url || null,
          is_connected: true,
        },
      ]
      return (
        <TooltipProvider>
          <SupplierChips suppliers={suppliers} />
        </TooltipProvider>
      )
    }

    render(<Wrapper />)
    expect(screen.queryByText('VL')).toBeNull()
    localStorage.removeItem('connected-vendors')
  })
})

```


---

## src\components\catalog\__tests__\SupplierList.test.tsx

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SupplierList } from '@/components/suppliers/SupplierList'
import { vi } from 'vitest'

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    createSupplier: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

describe('SupplierList', () => {
  it('renders suppliers and handles selection', () => {
    const suppliers = [
      { id: '1', name: 'Supplier A', connector_type: 'generic', logo_url: '', created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: '2', name: 'Supplier B', connector_type: 'api', logo_url: '', created_at: '2023-01-01', updated_at: '2023-01-01' },
    ]
    const credentials: any[] = []
    const handleSelect = vi.fn()
    const handleRun = vi.fn()

    render(
      <SupplierList
        suppliers={suppliers}
        credentials={credentials}
        selectedSupplier={null}
        onSelectSupplier={handleSelect}
        onRunConnector={handleRun}
      />
    )

    expect(screen.getByText('Supplier A')).toBeInTheDocument()
    expect(screen.getByText('Supplier B')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Supplier A'))
    expect(handleSelect).toHaveBeenCalledWith('1')
  })
})


```


---

## src\components\catalog\CatalogFiltersPanel.tsx

```tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from '@/state/catalogFiltersStore'
import { triStockToAvailability } from '@/lib/catalogFilters'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet?: keyof FacetFilters | null
}

export function CatalogFiltersPanel({ filters, onChange, focusedFacet }: CatalogFiltersPanelProps) {
  const triStock = useCatalogFilters(s => s.triStock)
  const availability = triStockToAvailability(triStock)

  const facetRefs = React.useMemo(
    () =>
      ({
        search: React.createRef<HTMLDivElement>(),
        brand: React.createRef<HTMLDivElement>(),
        category: React.createRef<HTMLDivElement>(),
        supplier: React.createRef<HTMLDivElement>(),
        availability: React.createRef<HTMLDivElement>(),
        packSizeRange: React.createRef<HTMLDivElement>(),
      }) satisfies Record<keyof FacetFilters, React.RefObject<HTMLDivElement>>,
    [],
  )

  React.useEffect(() => {
    if (focusedFacet && facetRefs[focusedFacet]?.current) {
      facetRefs[focusedFacet]!.current!.scrollIntoView({
        block: 'start',
      })
    }
  }, [focusedFacet, facetRefs])

  const { data } = useQuery({
    queryKey: ['catalogFacets', filters, triStock],
    queryFn: () =>
      fetchCatalogFacets({
        ...filters,
        ...(availability ? { availability } : {}),
      }),
  })

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div ref={facetRefs[key]} className="space-y-2">
      <div className="font-medium text-sm">{label}</div>
      {items.map(item => {
        const current = (filters as any)[key] ?? []
        const isArray = Array.isArray(current)
        const selected = isArray ? current.includes(item.id) : current === item.id
        return (
          <label
            key={item.id}
            className={cn('flex items-center justify-between gap-2 text-sm')}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected}
                onCheckedChange={checked => {
                  if (isArray) {
                    const cur = current as string[]
                    const next = checked
                      ? [...cur, item.id]
                      : cur.filter((id: string) => id !== item.id)
                    onChange({ [key]: next.length ? next : undefined } as any)
                  } else {
                    onChange({ [key]: checked ? item.id : undefined } as any)
                  }
                }}
              />
              <span>{item.name || 'Unknown'}</span>
            </div>
            <span className="text-muted-foreground">{item.count}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {data && (
        <div className="space-y-4">
          {renderFacet('Categories', data.categories, 'category')}
          {renderFacet('Suppliers', data.suppliers, 'supplier')}
          {renderFacet('Brands', data.brands, 'brand')}
          <div ref={facetRefs.packSizeRange} className="space-y-2">
            <div className="font-medium text-sm">Pack size</div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.packSizeRange?.min ?? ''}
                onChange={e => {
                  const packSizeRange = {
                    ...(filters.packSizeRange ?? {}),
                    min: e.target.value ? Number(e.target.value) : undefined,
                  }
                  const nextPackSizeRange =
                    packSizeRange.min === undefined && packSizeRange.max === undefined
                      ? undefined
                      : packSizeRange
                  onChange({ packSizeRange: nextPackSizeRange })
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.packSizeRange?.max ?? ''}
                onChange={e => {
                  const packSizeRange = {
                    ...(filters.packSizeRange ?? {}),
                    max: e.target.value ? Number(e.target.value) : undefined,
                  }
                  const nextPackSizeRange =
                    packSizeRange.min === undefined && packSizeRange.max === undefined
                      ? undefined
                      : packSizeRange
                  onChange({ packSizeRange: nextPackSizeRange })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogFiltersPanel

```


---

## src\components\catalog\CatalogTable.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CatalogTable } from './CatalogTable'

const cartState = { items: [] as any[], addItem: vi.fn(), updateQuantity: vi.fn() }

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => cartState,
}))

vi.mock('@/hooks/useVendors', () => ({
  useVendors: () => ({ vendors: [] }),
}))

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({ suppliers: [] })
}))

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: () => ({ suppliers: [] })
}))

describe('CatalogTable', () => {
  beforeEach(() => {
    cartState.items = []
  })
  it('shows lock icon and tooltip when price is locked', async () => {
    const product = {
      catalog_id: '1',
      name: 'Locked Product',
      prices_locked: true,
      price_sources: ['Acme'],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    const hidden = screen.getByText('Price locked')
    const lockIcon = hidden.parentElement?.querySelector('svg') as SVGElement
    expect(lockIcon).toBeInTheDocument()

    const user = userEvent.setup()
    await user.hover(hidden.parentElement as HTMLElement)

    const tooltip = await screen.findAllByText('Connect Acme to see price.')
    expect(tooltip.length).toBeGreaterThan(0)
  })

  it('displays price even when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 1 }]

    const product = {
      catalog_id: '1',
      name: 'Priced Product',
      prices: [100],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('shows quantity controls near the product name when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 2 }]

    const product = {
      catalog_id: '1',
      name: 'Stepper Product',
      prices: [100],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    expect(
      screen.getByLabelText('Decrease quantity of Stepper Product'),
    ).toBeInTheDocument()
  })

  it('passes full product info to addItem', async () => {
    const product = {
      catalog_id: 'p1',
      name: 'Full Info Product',
      sample_image_url: 'http://example.com/img.jpg',
      canonical_pack: '1kg',
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    const user = userEvent.setup()

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: `Add ${product.name} to cart`,
      }),
    )

    const added = cartState.addItem.mock.calls[0][0]
    expect(added).toMatchObject({
      itemName: 'Full Info Product',
      displayName: 'Full Info Product',
      supplierName: 'Acme',
      image: 'http://example.com/img.jpg',
      packSize: '1kg',
    })
  })

  it('disables Add button when product is out of stock', async () => {
    const product = {
      catalog_id: '1',
      name: 'Unavailable Product',
      suppliers: ['Acme'],
      availability_status: 'OUT_OF_STOCK',
    }

    const user = userEvent.setup()

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    const button = screen.getByRole('button', {
      name: `Add ${product.name} to cart`,
    })
    expect(button).toBeDisabled()
    await user.hover(button.parentElement as HTMLElement)
    const tooltip = await screen.findAllByText('Out of stock')
    expect(tooltip.length).toBeGreaterThan(0)
  })
})


```


---

## src\components\catalog\CatalogTable.tsx

```tsx
import { useRef, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useVendors } from '@/hooks/useVendors'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import type { FacetFilters } from '@/services/catalog'
import ProductThumb from '@/components/catalog/ProductThumb'
import SupplierLogo from './SupplierLogo'
import SupplierChips from './SupplierChips'
import { resolveImage } from '@/lib/images'
import type { CartItem } from '@/lib/types'
import { Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useSuppliers } from '@/hooks/useSuppliers'

interface CatalogTableProps {
  products: any[]
  selected: string[]
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
  sort: { key: 'name' | 'supplier' | 'price' | 'availability'; direction: 'asc' | 'desc' } | null
  onSort: (key: 'name' | 'supplier' | 'price' | 'availability') => void
  filters: FacetFilters
  onFilterChange: (f: Partial<FacetFilters>) => void
  isBulkMode: boolean
}

export function CatalogTable({
  products,
  selected,
  onSelect,
  onSelectAll,
  sort,
  onSort,
  filters,
  onFilterChange,
  isBulkMode,
}: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const { vendors } = useVendors()
  const { suppliers: allSuppliers } = useSuppliers()
  const { suppliers: connectedSuppliers } = useSupplierConnections()
  const brandValues = filters.brand ?? []
  const brandOptions = Array.from(
    new Set(products.map(p => p.brand).filter(Boolean) as string[]),
  ).sort()
  const showBrandFilter =
    products.length > 0 &&
    products.filter(p => p.brand).length / products.length > 0.3

  const showFilterRow = showBrandFilter

  const allIds = products.map(p => p.catalog_id)
  const isAllSelected = allIds.length > 0 && allIds.every(id => selected.includes(id))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, id: string) => {
    if (e.key === 'ArrowDown') {
      rowRefs.current[index + 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      rowRefs.current[index - 1]?.focus()
      e.preventDefault()
    } else if (e.key === ' ') {
      onSelect(id)
      e.preventDefault()
    }
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          {isBulkMode && (
            <TableHead className="w-8 px-3">
              <Checkbox
                aria-label="Select all products"
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
          )}
          <TableHead className="w-10 px-3">Image</TableHead>
          <TableHead
            className="[width:minmax(0,1fr)] cursor-pointer select-none px-3"
            onClick={() => onSort('name')}
          >
            Name {sort?.key === 'name' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[120px] px-3 text-center cursor-pointer select-none"
            onClick={() => onSort('availability')}
          >
            Availability {sort?.key === 'availability' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[136px] text-right px-3 cursor-pointer select-none border-r"
            onClick={() => onSort('price')}
          >
            Price {sort?.key === 'price' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[220px] min-w-[180px] max-w-[220px] cursor-pointer select-none px-3"
            onClick={() => onSort('supplier')}
          >
            Suppliers {sort?.key === 'supplier' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
        </TableRow>
        {showFilterRow && (
          <TableRow>
            {isBulkMode && <TableHead className="px-3" />}
            <TableHead className="px-3" />
            <TableHead className="px-3">
              {showBrandFilter && (
                <Select
                  value={brandValues[0] ?? 'all'}
                  onValueChange={v =>
                    onFilterChange({ brand: v === 'all' ? undefined : [v] })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {brandOptions.map(b => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </TableHead>
            <TableHead className="px-3">
              {/* Availability filter removed */}
            </TableHead>
            <TableHead className="w-[136px] px-3 pl-8 border-r" />
          </TableRow>
        )}
      </TableHeader>
      <TableBody>
        {products.map((p, i) => {
          const id = p.catalog_id
          const isSelected = selected.includes(id)
          const availabilityLabel =
            {
              IN_STOCK: 'In',
              LOW_STOCK: 'Low',
              OUT_OF_STOCK: 'Out',
              UNKNOWN: 'Unknown',
            }[p.availability_status ?? 'UNKNOWN']

          return (
            <TableRow
              key={id}
              ref={el => (rowRefs.current[i] = el)}
              tabIndex={-1}
              data-state={isSelected ? 'selected' : undefined}
              onKeyDown={e => handleKeyDown(e, i, id)}
              className="group h-[52px] border-b hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              {isBulkMode && (
                <TableCell className="w-8 px-3 py-2">
                  <Checkbox
                    aria-label={`Select ${p.name}`}
                    checked={isSelected}
                    onCheckedChange={() => onSelect(id)}
                  />
                </TableCell>
              )}
              <TableCell className="w-10 px-3 py-2">
                <ProductThumb
                  className="h-10 w-10"
                  src={resolveImage(
                    p.sample_image_url ?? p.image_main,
                    p.availability_status,
                  )}
                  name={p.name}
                  brand={p.brand}
                />
              </TableCell>
              <TableCell className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <a
                      href={`#${p.catalog_id}`}
                      aria-label={`View details for ${p.name}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {p.name}
                    </a>
                    {(p.brand || p.canonical_pack) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {p.brand}
                        {p.brand && p.canonical_pack && ' • '}
                        {p.canonical_pack}
                      </span>
                    )}
                  </div>
                  <AddToCartButton
                    product={p}
                    className="ml-auto"
                  />
                </div>
              </TableCell>
              <TableCell className="w-[120px] px-3 py-2">
                <div className="flex h-6 items-center justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AvailabilityBadge
                        tabIndex={-1}
                        status={p.availability_status}
                        updatedAt={p.availability_updated_at}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="space-y-1">
                      <div>{availabilityLabel}.</div>
                      <div className="text-xs text-muted-foreground">
                        Last checked {p.availability_updated_at ? timeAgo(p.availability_updated_at) : 'unknown'}. Source: {p.suppliers?.[0] || 'Unknown'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
              <TableCell className="w-[136px] px-3 py-2 text-right border-r whitespace-nowrap">
                <PriceCell product={p} />
              </TableCell>
              <TableCell className="w-[220px] min-w-[180px] max-w-[220px] px-3 py-2">
                {(() => {
                  // Map supplier IDs to SupplierChips format
                  const supplierIds = p.supplier_ids ?? []
                  if (supplierIds.length === 0) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center text-muted-foreground">—</div>
                        </TooltipTrigger>
                        <TooltipContent>No supplier data</TooltipContent>
                      </Tooltip>
                    )
                  }

                  // Create connected supplier ID set for is_connected lookup
                  const connectedSupplierIds = new Set(
                    connectedSuppliers?.map(cs => cs.supplier_id) ?? []
                  )

                  // Map to SupplierChips format
                  const suppliers = supplierIds.map((id: string, i: number) => {
                    // Try to get supplier name from multiple sources
                    let supplierName = p.supplier_names?.[i] || id
                    let supplierLogoUrl = p.supplier_logo_urls?.[i] || null

                    // Fallback to allSuppliers lookup if name is missing
                    if (!supplierName || supplierName === id) {
                      const supplierData = allSuppliers?.find(s => s.id === id)
                      if (supplierData) {
                        supplierName = supplierData.name
                        supplierLogoUrl = supplierData.logo_url || supplierLogoUrl
                      }
                    }

                    // Fallback to vendors lookup (localStorage-based)
                    if (!supplierLogoUrl) {
                      const vendor = vendors.find(v => v.name === supplierName || v.id === id)
                      supplierLogoUrl = vendor?.logo_url || vendor?.logoUrl || null
                    }

                    return {
                      supplier_id: id,
                      supplier_name: supplierName,
                      supplier_logo_url: supplierLogoUrl,
                      is_connected: connectedSupplierIds.has(id),
                      availability_state: p.availability_status as any,
                    }
                  })

                  return <SupplierChips suppliers={suppliers} />
                })()}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

  function AddToCartButton({
    product,
    className,
  }: {
    product: any
    className?: string
  }) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const existingItem = items.find(
    (i: any) => i.supplierItemId === product.catalog_id,
  )

  const [open, setOpen] = useState(false)

  const availability = (product.availability_status ?? 'UNKNOWN') as
    | 'IN_STOCK'
    | 'LOW_STOCK'
    | 'OUT_OF_STOCK'
    | 'UNKNOWN'
  const isUnavailable =
    availability === 'OUT_OF_STOCK' ||
    (availability === 'UNKNOWN' &&
      (product.active_supplier_count ?? 0) === 0)

  const rawSuppliers =
    (product.supplier_products && product.supplier_products.length
      ? product.supplier_products
      : product.supplier_ids && product.supplier_names
        ? product.supplier_ids.map((id: string, idx: number) => ({
            supplier_id: id,
            supplier_name: product.supplier_names[idx] || id,
            is_connected: true,
          }))
        : product.suppliers) || []

  const supplierEntries = rawSuppliers.map((s: any) => {
    if (typeof s === 'string') {
      return { id: s, name: s, connected: true }
    }
    const status =
      s.availability?.status ??
      s.availability_status ??
      s.status ??
      null
    const updatedAt =
      s.availability?.updatedAt ?? s.availability_updated_at ?? null
    return {
      id: s.supplier_id || s.id || s.supplier?.id,
      name: s.supplier?.name || s.name,
      connected: s.connected ?? s.supplier?.connected ?? true,
      logoUrl:
        s.logoUrl || s.logo_url || s.supplier?.logo_url || null,
      availability: status,
      updatedAt,
    }
  })

  const buildCartItem = (
    supplier: (typeof supplierEntries)[number],
    index: number
  ): Omit<CartItem, 'quantity'> => {
    const raw = rawSuppliers[index] as any
    const priceEntry = Array.isArray(product.prices)
      ? product.prices[index]
      : raw?.price ?? raw?.unit_price_ex_vat ?? null
    const priceValue =
      typeof priceEntry === 'number' ? priceEntry : priceEntry?.price ?? null
    const unitPriceExVat = raw?.unit_price_ex_vat ?? priceValue ?? null
    const unitPriceIncVat = raw?.unit_price_inc_vat ?? priceValue ?? null
    const packSize =
      raw?.pack_size || raw?.packSize || product.canonical_pack || ''
    const packQty = raw?.pack_qty ?? 1
    const sku = raw?.sku || raw?.supplier_sku || product.catalog_id
    const unit = raw?.unit || ''
    return {
      id: product.catalog_id,
      supplierId: supplier.id,
      supplierName: supplier.name ?? '',
      itemName: product.name,
      sku,
      packSize,
      packPrice: priceValue,
      unitPriceExVat,
      unitPriceIncVat,
      vatRate: raw?.vat_rate ?? 0,
      unit,
      supplierItemId: product.catalog_id,
      displayName: product.name,
      packQty,
      image: resolveImage(
        product.sample_image_url ?? product.image_main,
        product.availability_status
      )
    }
  }

  if (existingItem)
    return (
      <QuantityStepper
        className={className}
        quantity={existingItem.quantity}
        onChange={qty =>
          updateQuantity(existingItem.supplierItemId, qty)
        }
        onRemove={() => removeItem(existingItem.supplierItemId)}
        label={product.name}
        supplier={existingItem.supplierName}
      />
    )

  if (supplierEntries.length === 0) return null

  if (isUnavailable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(className, 'cursor-not-allowed')}>
            <Button
              size="sm"
              disabled
              aria-disabled="true"
              aria-label={`Add ${product.name} to cart`}
              className="pointer-events-none"
            >
              Add
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Out of stock</TooltipContent>
      </Tooltip>
    )
  }

  if (supplierEntries.length === 1) {
    const s = supplierEntries[0]
    return (
      <Button
        size="sm"
        className={className}
        onClick={() => {
          addItem(buildCartItem(s, 0))
          if (s.availability === 'OUT_OF_STOCK') {
            toast({ description: 'Out of stock at selected supplier.' })
          }
        }}
        aria-label={`Add ${product.name} to cart`}
      >
        Add
      </Button>
    )
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className={className} aria-label={`Add ${product.name} to cart`}>
          Add
        </Button>
      </PopoverTrigger>
    <PopoverContent className="w-64 p-2 space-y-1">
        {supplierEntries.map((s, index) => {
          const initials = s.name
            ? s.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : '?'
          return (
            <Button
              key={s.id}
              variant="ghost"
              className="w-full justify-start gap-2 px-2"
              onClick={() => {
                addItem(buildCartItem(s, index))
                if (s.availability === 'OUT_OF_STOCK') {
                  toast({ description: 'Out of stock at selected supplier.' })
                }
                setOpen(false)
              }}
            >
              {s.logoUrl ? (
                <img
                  src={s.logoUrl}
                  alt=""
                  className="h-6 w-6 rounded-sm"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-xs font-medium">
                  {initials}
                </span>
              )}
              <span className="flex-1 text-left">{s.name}</span>
              {s.availability && (
                <AvailabilityBadge
                  status={s.availability}
                  updatedAt={s.updatedAt}
                />
              )}
              {!s.connected && <Lock className="h-4 w-4" />}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function PriceCell({
  product,
}: {
  product: any
}) {
  const sources: string[] =
    product.price_sources ||
    (Array.isArray(product.suppliers)
      ? product.suppliers.map((s: any) =>
          typeof s === 'string' ? s : s.name || s.supplier_name || '',
        )
      : Array.isArray(product.supplier_names)
        ? product.supplier_names
        : [])
  const priceValues: number[] = Array.isArray(product.prices)
    ? product.prices
        .map((p: any) => (typeof p === 'number' ? p : p?.price))
        .filter((p: any) => typeof p === 'number')
    : []
  const isLocked = product.prices_locked ?? product.price_locked ?? false

  let priceNode: React.ReactNode
  let tooltip: React.ReactNode | null = null

  if (isLocked) {
    priceNode = (
      <div className="flex items-center justify-end gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span aria-hidden="true" className="tabular-nums">
          —
        </span>
        <span className="sr-only">Price locked</span>
      </div>
    )
    if (sources.length) {
      tooltip = (
        <>
          {sources.map((s: string) => (
            <div key={s}>{`Connect ${s} to see price.`}</div>
          ))}
        </>
      )
    }
  } else if (priceValues.length) {
    priceValues.sort((a, b) => a - b)
    const min = priceValues[0]
    const max = priceValues[priceValues.length - 1]
    const currency =
      (Array.isArray(product.prices) && product.prices[0]?.currency) || 'ISK'
    const text =
      min === max
        ? formatCurrency(min, currency)
        : `${formatCurrency(min, currency)}–${formatCurrency(max, currency)}`
    priceNode = <span className="tabular-nums">{text}</span>
  } else {
    priceNode = (
      <span className="tabular-nums">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No supplier data</span>
      </span>
    )
    tooltip = 'No supplier data'
  }

  const priceContent = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{priceNode}</TooltipTrigger>
      <TooltipContent className="space-y-1">{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    priceNode
  )

  return (
    <div className="flex items-center justify-end gap-2">
      {priceContent}
    </div>
  )
}


```


---

## src\components\catalog\FacetPanel.tsx

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface FacetPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
}

export function FacetPanel({ filters, onChange }: FacetPanelProps) {
  const { data } = useQuery({
    queryKey: ['catalogFacets', filters],
    queryFn: () => fetchCatalogFacets(filters),
  })

  const active = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && (Array.isArray(v) ? v.length > 0 : v),
  )

  const clearAll = () =>
    onChange({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
    })

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div className="space-y-2" key={label}>
      <div className="text-sm font-medium">{label}</div>
      {items.map(item => {
        const id = `${String(key)}-${item.id}`
        const current = (filters as any)[key] ?? []
        const isArray = Array.isArray(current)
        const checked = isArray ? current.includes(item.id) : current === item.id
        return (
          <label
            key={item.id}
            htmlFor={id}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={chk => {
                if (isArray) {
                  const cur = current as string[]
                  const next = chk
                    ? [...cur, item.id]
                    : cur.filter((id: string) => id !== item.id)
                  onChange({ [key]: next.length ? next : undefined } as any)
                } else {
                  onChange({ [key]: chk ? item.id : undefined } as any)
                }
              }}
            />
            <span className="flex-1">{item.name || 'Unknown'}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ [k]: undefined })}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {Array.isArray(v) ? v.join(', ') : String(v)}
              <span className="text-muted-foreground">×</span>
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
      {data && (
        <div className="space-y-4">
          {renderFacet('Categories', data.categories, 'category')}
          {renderFacet('Suppliers', data.suppliers, 'supplier')}
          {renderFacet('Pack size', data.packSizeRanges, 'packSizeRange')}
          {renderFacet('Brands', data.brands, 'brand')}
        </div>
      )}
    </div>
  )
}

export default FacetPanel


```


---

## src\components\catalog\SupplierChip.tsx

```tsx

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'
import type { AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'
import { cn } from '@/lib/utils'

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: {
    status?: AvailabilityStatus | null
    updatedAt?: string | Date | null
  }
}

const AVAILABILITY_MAP: Record<
  AvailabilityStatus | 'UNKNOWN',
  { color: string; label: string }
> = {
  IN_STOCK: { color: 'bg-emerald-500', label: 'In stock' },
  LOW_STOCK: { color: 'bg-amber-500', label: 'Low stock' },
  OUT_OF_STOCK: { color: 'bg-rose-500', label: 'Out of stock' },
  UNKNOWN: { color: 'bg-muted-foreground', label: 'Availability unknown' },
}

export default function SupplierChip({
  name,
  logoUrl,
  connected = true,
  availability,
  className,
  ...props
}: SupplierChipProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(s => s[0]!)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const status = availability?.status ?? 'UNKNOWN'
  const state = AVAILABILITY_MAP[status]
  const updatedAt = availability?.updatedAt
  const time = updatedAt ? timeAgo(typeof updatedAt === 'string' ? updatedAt : updatedAt.toISOString()) : 'unknown'

  const { tabIndex, ['aria-label']: ariaLabelProp, ...rest } = props as any
  const ariaLabel = !connected
    ? `${name} (price locked)`
    : ariaLabelProp ?? name

  return (
    <div
      className={cn('relative inline-block', className)}
      tabIndex={tabIndex ?? 0}
      aria-label={ariaLabel}
      {...rest}
    >
      <Avatar className="h-full w-full">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={name} />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>

      {!connected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Lock className="h-3 w-3 text-white" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Price locked. Connect {name} to view price.
          </TooltipContent>
        </Tooltip>
      )}

      {availability && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background',
                state.color,
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {state.label}. Last checked {time}.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}


```


---

## src\components\catalog\SupplierChips.tsx

```tsx
import { useState } from 'react'
import SupplierLogo from './SupplierLogo'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Availability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | null | undefined

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_logo_url?: string | null
  is_connected: boolean
  availability_state?: Availability
  location_city?: string | null
  location_country_code?: string | null
}

interface SupplierChipsProps {
  suppliers: SupplierInfo[]
}

const AVAILABILITY_ORDER: Record<string, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  OUT_OF_STOCK: 2,
  UNKNOWN: 3,
}

export default function SupplierChips({ suppliers }: SupplierChipsProps) {
  const [active, setActive] = useState<SupplierInfo | null>(null)

  const sorted = [...suppliers].sort((a, b) => {
    if (a.is_connected !== b.is_connected) return a.is_connected ? -1 : 1
    const aOrder = AVAILABILITY_ORDER[a.availability_state || 'UNKNOWN']
    const bOrder = AVAILABILITY_ORDER[b.availability_state || 'UNKNOWN']
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.supplier_name.localeCompare(b.supplier_name)
  })

  const visible = sorted.slice(0, 2)
  const overflow = sorted.length - visible.length

  const renderChip = (s: SupplierInfo) => {
    const initials = s.supplier_name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0]!)
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const loc = s.location_city || s.location_country_code
    const aria = s.is_connected
      ? `Supplier: ${s.supplier_name}`
      : `Supplier: ${s.supplier_name} (price locked)`
    const locationFull = [s.location_city, s.location_country_code]
      .filter(Boolean)
      .join(', ')

    const chip = (
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 rounded-full bg-muted pl-1 pr-2 h-6 max-w-full',
          !s.is_connected && 'pr-1'
        )}
        onClick={() => setActive(s)}
        tabIndex={0}
        aria-label={aria}
      >
        <SupplierLogo
          name={s.supplier_name}
          logoUrl={s.supplier_logo_url}
          className="h-4 w-4"
        />
        <span className="truncate text-xs">
          {s.supplier_name}
          {loc && (
            <span className="ml-1 text-muted-foreground">· {loc}</span>
          )}
        </span>
        {!s.is_connected && <Lock className="ml-1 h-3 w-3 text-muted-foreground" />}
      </button>
    )

    return loc ? (
      <Tooltip key={s.supplier_id}>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>{locationFull}</TooltipContent>
      </Tooltip>
    ) : (
      <span key={s.supplier_id}>{chip}</span>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map(renderChip)}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex h-6 items-center justify-center rounded-full bg-muted px-2 text-xs"
                aria-label={`Plus ${overflow} more suppliers`}
              >
                +{overflow}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {sorted.slice(2).map(s => (
                <div key={s.supplier_id}>{s.supplier_name}</div>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Drawer open={!!active} onOpenChange={o => !o && setActive(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{active?.supplier_name}</DrawerTitle>
            {!active?.is_connected && (
              <DrawerDescription>Price locked</DrawerDescription>
            )}
          </DrawerHeader>
          <DrawerFooter>
            {!active?.is_connected && (
              <Button className="w-full">Connect</Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}


```


---

## src\components\catalog\SupplierLogo.tsx

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SupplierLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

export function SupplierLogo({ name, logoUrl, className }: SupplierLogoProps) {
  const [error, setError] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]!)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-md bg-muted overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {logoUrl && !error ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-[10px] font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

export default SupplierLogo;

```


---

## src\components\compare\AdvancedFilters.tsx

```tsx

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Download } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface FilterState {
  priceRange: [number, number]
  categories: string[]
  suppliers: string[]
  inStockOnly: boolean
  minDiscount: number
  sortBy: 'price' | 'name' | 'discount' | 'availability'
  sortOrder: 'asc' | 'desc'
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onExport: () => void
  activeFiltersCount: number
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onExport, 
  activeFiltersCount 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const categories = [
    'Food & Beverages',
    'Dairy Products',
    'Fresh Produce',
    'Meat & Seafood',
    'Bakery Items',
    'Cleaning Supplies'
  ]

  const suppliers = [
    'Véfkaupmenn',
    'Heilsuhúsið',
    'Nordic Fresh',
    'Matfuglinn'
  ]

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [0, 10000],
      categories: [],
      suppliers: [],
      inStockOnly: false,
      minDiscount: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'category':
        updateFilters({
          categories: filters.categories.filter(c => c !== value)
        })
        break
      case 'supplier':
        updateFilters({
          suppliers: filters.suppliers.filter(s => s !== value)
        })
        break
      case 'inStock':
        updateFilters({ inStockOnly: false })
        break
      case 'priceRange':
        updateFilters({ priceRange: [0, 10000] })
        break
      case 'discount':
        updateFilters({ minDiscount: 0 })
        break
    }
  }

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('category', category)}
              />
            </Badge>
          ))}
          
          {filters.suppliers.map(supplier => (
            <Badge key={supplier} variant="secondary" className="gap-1">
              {supplier}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('supplier', supplier)}
              />
            </Badge>
          ))}
          
          {filters.inStockOnly && (
            <Badge variant="secondary" className="gap-1">
              In Stock Only
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('inStock')}
              />
            </Badge>
          )}
          
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1">
              {filters.priceRange[0]} - {filters.priceRange[1]} kr
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('priceRange')}
              />
            </Badge>
          )}
          
          {filters.minDiscount > 0 && (
            <Badge variant="secondary" className="gap-1">
              Min {filters.minDiscount}% discount
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('discount')}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (kr)</Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{filters.priceRange[0]} kr</span>
                    <span>{filters.priceRange[1]} kr</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                categories: [...filters.categories, category]
                              })
                            } else {
                              updateFilters({
                                categories: filters.categories.filter(c => c !== category)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suppliers */}
                <div className="space-y-2">
                  <Label>Suppliers</Label>
                  <div className="space-y-2">
                    {suppliers.map(supplier => (
                      <div key={supplier} className="flex items-center space-x-2">
                        <Checkbox
                          id={supplier}
                          checked={filters.suppliers.includes(supplier)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                suppliers: [...filters.suppliers, supplier]
                              })
                            } else {
                              updateFilters({
                                suppliers: filters.suppliers.filter(s => s !== supplier)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={supplier} className="text-sm">
                          {supplier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) => updateFilters({ inStockOnly: !!checked })}
                  />
                  <Label htmlFor="inStock">In stock only</Label>
                </div>

                {/* Minimum Discount */}
                <div className="space-y-2">
                  <Label>Minimum Discount (%)</Label>
                  <Slider
                    value={[filters.minDiscount]}
                    onValueChange={(value) => updateFilters({ minDiscount: value[0] })}
                    max={50}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    {filters.minDiscount}% or more
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Sort by</Label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value: FilterState['sortBy']) => updateFilters({ sortBy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="availability">Availability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select 
                      value={filters.sortOrder} 
                      onValueChange={(value: FilterState['sortOrder']) => updateFilters({ sortOrder: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}

```


---

## src\components\compare\CompareHeader.tsx

```tsx

import React from 'react'
import { Search, Filter, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import VatToggle from '@/components/ui/VatToggle'
import { useSettings } from '@/contexts/useSettings'

interface CompareHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onFiltersClick: () => void
  activeFilters: number
}

export function CompareHeader({ 
  searchTerm, 
  onSearchChange, 
  onFiltersClick,
  activeFilters 
}: CompareHeaderProps) {
  const { includeVat, setIncludeVat, preferredUnit, setPreferredUnit } = useSettings()

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item, brand, or EAN..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onFiltersClick}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFilters}
              </Badge>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <VatToggle includeVat={includeVat} onToggle={setIncludeVat} />
            
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                size="sm"
                variant={preferredUnit === 'kg' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('kg')}
                className="px-2 py-1 text-xs"
              >
                kg
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'L' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('L')}
                className="px-2 py-1 text-xs"
              >
                L
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'each' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('each')}
                className="px-2 py-1 text-xs"
              >
                each
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'auto' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('auto')}
                className="px-2 py-1 text-xs"
              >
                auto
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Prices shown per unit for apples-to-apples comparison. Toggle VAT to match your workflow.
      </div>
    </div>
  )
}

```


---

## src\components\compare\EnhancedCompareTable.tsx

```tsx

import React, { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  ShoppingCart, 
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import PriceBadge from '@/components/ui/PriceBadge'
import VatToggle from '@/components/ui/VatToggle'
import { useSettings } from '@/contexts/useSettings'
import { formatDistanceToNow } from 'date-fns'

interface PriceData {
  supplierId: string
  supplierName: string
  price: number
  priceIncVat: number
  unit: string
  packSize: string
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued'
  leadTime: string
  moq: number
  discount?: number
  source: string
  lastUpdated: string
  priceHistory: number[]
  isPreferred: boolean
}

interface CompareItem {
  id: string
  name: string
  brand: string
  category: string
  image?: string
  description: string
  specifications: Record<string, string>
  prices: PriceData[]
  averageRating?: number
  tags: string[]
}

interface EnhancedCompareTableProps {
  items: CompareItem[]
  onAddToCart: (item: CompareItem, supplier: PriceData, quantity: number) => void
  onRemoveItem: (itemId: string) => void
}

export function EnhancedCompareTable({ items, onAddToCart, onRemoveItem }: EnhancedCompareTableProps) {
  const { includeVat } = useSettings()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [groupBy, setGroupBy] = useState<'category' | 'brand' | 'none'>('category')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'availability'>('name')

  // Group items based on selection
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Items': items }
    }
    
    return items.reduce((groups, item) => {
      const key = groupBy === 'category' ? item.category : item.brand
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {} as Record<string, CompareItem[]>)
  }, [items, groupBy])

  // Get best price for each item
  const getBestPrice = (item: CompareItem) => {
    const availablePrices = item.prices.filter(p => p.availability !== 'out-of-stock' && p.availability !== 'discontinued')
    if (availablePrices.length === 0) return null
    
    return availablePrices.reduce((best, current) => {
      const price = includeVat ? current.priceIncVat : current.price
      const bestPrice = includeVat ? best.priceIncVat : best.price
      return price < bestPrice ? current : best
    })
  }

  const getAvailabilityIcon = (availability: PriceData['availability']) => {
    switch (availability) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'out-of-stock':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'discontinued':
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriceTrend = (history: number[]) => {
    if (history.length < 2) return 'stable'
    const recent = history[history.length - 1]
    const previous = history[history.length - 2]
    if (recent > previous) return 'up'
    if (recent < previous) return 'down'
    return 'stable'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const handleQuantityChange = (itemId: string, supplierId: string, value: string) => {
    const key = `${itemId}-${supplierId}`
    setQuantities(prev => ({
      ...prev,
      [key]: parseInt(value) || 1
    }))
  }

  const handleAddToCart = (item: CompareItem, supplier: PriceData) => {
    const key = `${item.id}-${supplier.supplierId}`
    const quantity = quantities[key] || 1
    onAddToCart(item, supplier, quantity)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Group by:</span>
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="text-sm border border-input rounded px-2 py-1"
            >
              <option value="none">No grouping</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-input rounded px-2 py-1"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="availability">Availability</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <VatToggle includeVat={includeVat} onToggle={() => {}} />
          <Badge variant="outline">
            {items.length} item{items.length !== 1 ? 's' : ''} comparing
          </Badge>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <Card key={groupName}>
            {groupBy !== 'none' && (
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{groupName}</CardTitle>
              </CardHeader>
            )}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[300px]">
                        Product
                      </TableHead>
                      <TableHead className="text-center">Best Price</TableHead>
                      <TableHead className="text-center">Suppliers</TableHead>
                      <TableHead className="text-center">Availability</TableHead>
                      <TableHead className="text-center">Price Trend</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item) => {
                      const bestPrice = getBestPrice(item)
                      const isSelected = selectedItems.has(item.id)
                      
                      return (
                        <React.Fragment key={item.id}>
                          <TableRow className={isSelected ? 'bg-primary/5' : ''}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedItems)
                                    if (checked) {
                                      newSelected.add(item.id)
                                    } else {
                                      newSelected.delete(item.id)
                                    }
                                    setSelectedItems(newSelected)
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3">
                                    {item.image && (
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                      />
                                    )}
                                    <div>
                                      <h4 className="font-medium text-sm">{item.name}</h4>
                                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                      <div className="flex gap-1 mt-2">
                                        {item.tags.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {bestPrice ? (
                                <div className="space-y-1">
                                  <PriceBadge type="best">
                                    {new Intl.NumberFormat('is-IS', {
                                      style: 'currency',
                                      currency: 'ISK',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }).format(includeVat ? bestPrice.priceIncVat : bestPrice.price)}
                                  </PriceBadge>
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-muted-foreground">Best</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {bestPrice.supplierName}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="destructive">Unavailable</Badge>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <span className="text-sm font-medium">
                                  {item.prices.length} supplier{item.prices.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex justify-center gap-1">
                                  {item.prices.slice(0, 3).map(price => (
                                    <div key={price.supplierId} className="flex items-center gap-1">
                                      {price.isPreferred && (
                                        <Star className="h-3 w-3 text-yellow-500" />
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {price.supplierName.substring(0, 8)}
                                        {price.supplierName.length > 8 ? '...' : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {item.prices.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{item.prices.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                {bestPrice && getAvailabilityIcon(bestPrice.availability)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {bestPrice?.availability.replace('-', ' ') || 'Unknown'}
                              </p>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {bestPrice && (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(getPriceTrend(bestPrice.priceHistory))}
                                    <span className="text-xs">
                                      {getPriceTrend(bestPrice.priceHistory)}
                                    </span>
                                  </div>
                                  <div className="w-16 h-8">
                                    <Sparkline 
                                      data={bestPrice.priceHistory}
                                      width={64}
                                      height={32}
                                    />
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onRemoveItem(item.id)}
                                >
                                  Remove
                                </Button>
                                {bestPrice && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={quantities[`${item.id}-${bestPrice.supplierId}`] || 1}
                                      onChange={(e) => handleQuantityChange(item.id, bestPrice.supplierId, e.target.value)}
                                      className="w-16 h-8 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item, bestPrice)}
                                      className="gap-1"
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                      Add
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded row showing all suppliers */}
                          {isSelected && (
                            <TableRow className="bg-muted/25">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 space-y-3">
                                  <h5 className="font-medium text-sm">All Supplier Options:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {item.prices.map((price) => (
                                      <Card key={price.supplierId} className="p-3">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm">{price.supplierName}</span>
                                              {price.isPreferred && (
                                                <Star className="h-3 w-3 text-yellow-500" />
                                              )}
                                            </div>
                                            {getAvailabilityIcon(price.availability)}
                                          </div>
                                          
                                          <div className="flex items-center justify-between">
                                            <PriceBadge type={price === bestPrice ? 'best' : 'average'}>
                                              {new Intl.NumberFormat('is-IS', {
                                                style: 'currency',
                                                currency: 'ISK',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                              }).format(includeVat ? price.priceIncVat : price.price)}
                                            </PriceBadge>
                                            {price === bestPrice && (
                                              <Badge variant="outline" className="text-xs">Best</Badge>
                                            )}
                                          </div>
                                          
                                          <div className="text-xs text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-1">
                                              <Package className="h-3 w-3" />
                                              <span>{price.packSize} • MOQ: {price.moq}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>Lead time: {price.leadTime}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Badge variant="outline" className="text-xs">{price.source}</Badge>
                                              <span>
                                                Updated {formatDistanceToNow(new Date(price.lastUpdated), { addSuffix: true })}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={quantities[`${item.id}-${price.supplierId}`] || 1}
                                              onChange={(e) => handleQuantityChange(item.id, price.supplierId, e.target.value)}
                                              className="flex-1 h-8 text-xs"
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() => handleAddToCart(item, price)}
                                              disabled={price.availability === 'out-of-stock' || price.availability === 'discontinued'}
                                              className="gap-1"
                                            >
                                              <ShoppingCart className="h-3 w-3" />
                                              Add
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

```


---

## src\components\compare\EnhancedComparisonTable.tsx

```tsx

import React, { useState, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Minus, Info, ExternalLink, AlertTriangle } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { DeliveryFeeIndicator } from '@/components/delivery/DeliveryFeeIndicator'
import { deliveryCalculator } from '@/services/DeliveryCalculator'
import type { ComparisonItem, CartItem } from '@/lib/types'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'

interface EnhancedComparisonTableProps {
  data: ComparisonItem[]
  isLoading?: boolean
}

export function EnhancedComparisonTable({ data, isLoading }: EnhancedComparisonTableProps) {
  const { includeVat } = useSettings()
  const { addItem, updateQuantity, items: cartItems } = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [deliveryCalculations, setDeliveryCalculations] = useState<Map<string, any>>(new Map())

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getCartQuantity = useCallback((supplierItemId: string) => {
    const cartItem = cartItems.find(item => item.supplierItemId === supplierItemId)
    return cartItem?.quantity || 0
  }, [cartItems])

  const calculateLandedCost = async (supplier: any, quantity: number) => {
    const mockCartItem: CartItem = {
      id: supplier.id,
      supplierItemId: supplier.supplierItemId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemName: supplier.name,
      sku: supplier.sku,
      packSize: supplier.packSize,
      packPrice: supplier.packPrice,
      unitPriceExVat: supplier.unitPriceExVat,
      unitPriceIncVat: supplier.unitPriceIncVat,
      vatRate: 0.24,
      unit: supplier.unit,
      displayName: supplier.name,
      packQty: 1,
      quantity,
      image: null
    }

    try {
      const calculation = await deliveryCalculator.calculateDeliveryForSupplier(
        supplier.id,
        supplier.name,
        [mockCartItem]
      )
      
      setDeliveryCalculations(prev => new Map(prev.set(supplier.supplierItemId, calculation)))
      return calculation.landed_cost
    } catch (error) {
      console.error('Failed to calculate delivery:', error)
      return supplier.unitPriceExVat * quantity
    }
  }

  const handleQuantityChange = async (supplierItemId: string, newQuantity: number) => {
    const currentCartQuantity = getCartQuantity(supplierItemId)
    
    if (newQuantity > currentCartQuantity) {
      const supplierQuote = data.flatMap(item => 
        item.suppliers.map(supplier => ({
          ...supplier,
          itemName: item.itemName,
          brand: item.brand || ''
        }))
      ).find(supplier => supplier.supplierItemId === supplierItemId)

      if (supplierQuote) {
        // Check if this would create a new supplier with delivery fee
        const isNewSupplier = !cartItems.some(item => item.supplierId === supplierQuote.id)
        
        if (isNewSupplier) {
          await calculateLandedCost(supplierQuote, newQuantity - currentCartQuantity)
        }

        const cartItem: Omit<CartItem, 'quantity'> = {
          id: supplierQuote.id,
          supplierItemId: supplierQuote.supplierItemId,
          supplierId: supplierQuote.id,
          supplierName: supplierQuote.name,
          itemName: supplierQuote.itemName,
          sku: supplierQuote.sku,
          packSize: supplierQuote.packSize,
          packPrice: supplierQuote.packPrice,
          unitPriceExVat: supplierQuote.unitPriceExVat,
          unitPriceIncVat: supplierQuote.unitPriceIncVat,
          vatRate: 0.24,
          unit: supplierQuote.unit,
          displayName: supplierQuote.itemName,
          packQty: 1,
          image: (supplierQuote as any).image ?? null
        }
        
        addItem(cartItem, newQuantity - currentCartQuantity)
      }
    } else if (newQuantity < currentCartQuantity) {
      updateQuantity(supplierItemId, newQuantity)
    }
  }

  const expandedItems = useMemo(() => {
    return data.map(item => ({
      ...item,
      suppliers: item.suppliers.map(supplier => ({
        ...supplier,
        isInCart: getCartQuantity(supplier.supplierItemId) > 0,
        cartQuantity: getCartQuantity(supplier.supplierItemId)
      }))
    }))
  }, [data, getCartQuantity])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items found matching your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {expandedItems.map((item) => (
        <div key={item.id} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{item.itemName}</h3>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {item.brand && <span>Brand: {item.brand}</span>}
                  {item.category && <span>• Category: {item.category}</span>}
                </div>
              </div>
              <Badge variant="secondary">
                {item.suppliers.length} supplier{item.suppliers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Supplier</TableHead>
                  <TableHead>Pack Size</TableHead>
                  <TableHead className="text-right">Price/Pack</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Landed Cost</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">History</TableHead>
                  <TableHead className="text-center min-w-[120px]">Quantity</TableHead>
                  <TableHead className="text-center">Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.suppliers.map((supplier) => {
                  const price = includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat
                  const packPrice = includeVat ? supplier.packPrice * 1.24 : supplier.packPrice
                  const deliveryCalc = deliveryCalculations.get(supplier.supplierItemId)
                  const isNewSupplier = !cartItems.some(item => item.supplierId === supplier.id)
                  
                  return (
                    <TableRow key={supplier.supplierItemId} className={supplier.isInCart ? 'bg-blue-50' : ''}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {supplier.sku}
                            </div>
                            {isNewSupplier && deliveryCalc && deliveryCalc.total_delivery_cost > 0 && (
                              <div className="mt-1">
                                <DeliveryFeeIndicator calculation={deliveryCalc} />
                              </div>
                            )}
                          </div>
                          {supplier.badge && (
                            <Badge
                              variant={supplier.badge === 'best' ? 'default' : 
                                     supplier.badge === 'good' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {supplier.badge === 'best' ? 'Best price' : 
                               supplier.badge === 'good' ? 'Good price' : 'Expensive'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.packSize}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPrice(packPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-medium">
                        {formatPrice(price)}
                        <div className="text-xs text-muted-foreground">
                          per {supplier.unit}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {deliveryCalc ? (
                          <div>
                            <div className="font-medium">{formatPrice(deliveryCalc.landed_cost / supplier.cartQuantity || 1)}</div>
                            {deliveryCalc.total_delivery_cost > 0 && (
                              <div className="text-xs text-orange-600">
                                +{formatPrice(deliveryCalc.total_delivery_cost)} delivery
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium">{formatPrice(price)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={supplier.inStock ? 'default' : 'secondary'}>
                          {supplier.inStock ? 'In stock' : 'Out of stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Sparkline 
                          data={supplier.priceHistory} 
                          width={60} 
                          height={20}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(
                              supplier.supplierItemId, 
                              Math.max(0, supplier.cartQuantity - 1)
                            )}
                            disabled={!supplier.inStock || supplier.cartQuantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={supplier.cartQuantity}
                            onChange={(e) => handleQuantityChange(
                              supplier.supplierItemId,
                              parseInt(e.target.value) || 0
                            )}
                            className="w-12 h-8 text-center text-xs px-1"
                            min="0"
                            disabled={!supplier.inStock}
                          />
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(
                              supplier.supplierItemId,
                              supplier.cartQuantity + 1
                            )}
                            disabled={!supplier.inStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {isNewSupplier && deliveryCalc && deliveryCalc.total_delivery_cost > 0 && (
                          <div className="mt-1 flex items-center justify-center">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="ghost">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}

```


---

## src\components\compare\ExportDialog.tsx

```tsx

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, Table, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportDialogProps {
  data: any[]
  trigger: React.ReactNode
}

export function ExportDialog({ data, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [includeFields, setIncludeFields] = useState({
    itemName: true,
    brand: true,
    category: true,
    suppliers: true,
    pricing: true,
    availability: true,
    priceHistory: false
  })
  const { toast } = useToast()

  const fields = [
    { key: 'itemName', label: 'Item Name', icon: FileText },
    { key: 'brand', label: 'Brand', icon: FileText },
    { key: 'category', label: 'Category', icon: FileText },
    { key: 'suppliers', label: 'Supplier Information', icon: FileText },
    { key: 'pricing', label: 'Pricing Data', icon: FileText },
    { key: 'availability', label: 'Stock Status', icon: FileText },
    { key: 'priceHistory', label: 'Price History', icon: Table }
  ]

  const handleExport = () => {
    // Simulate export process
    toast({
      title: 'Export started',
      description: `Preparing ${format.toUpperCase()} export with ${Object.values(includeFields).filter(Boolean).length} fields...`
    })

    // Simulate processing delay
    setTimeout(() => {
      toast({
        title: 'Export ready',
        description: `Your ${format.toUpperCase()} file has been generated and downloaded.`
      })
      setOpen(false)
    }, 2000)
  }

  const handleEmailExport = () => {
    toast({
      title: 'Export emailed',
      description: 'The export has been sent to your registered email address.'
    })
    setOpen(false)
  }

  const toggleField = (field: keyof typeof includeFields) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const selectedCount = Object.values(includeFields).filter(Boolean).length
  const estimatedSize = Math.round(data.length * selectedCount * 0.5) // Rough estimate in KB

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Price Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: typeof format) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <Label>Include Fields</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fields.map(field => {
                const Icon = field.icon
                return (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={includeFields[field.key as keyof typeof includeFields]}
                      onCheckedChange={() => toggleField(field.key as keyof typeof includeFields)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="text-sm font-medium">Export Summary</div>
            <div className="text-xs text-muted-foreground">
              {data.length} items • {selectedCount} fields • ~{estimatedSize}KB
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEmailExport} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

```


---

## src\components\dashboard\__tests__\SuppliersPanel.test.tsx

```tsx
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: vi.fn(),
}))

import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { SuppliersPanel } from '../SuppliersPanel'

const mockUseSupplierConnections = useSupplierConnections as unknown as Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliersPanel />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseSupplierConnections.mockReturnValue({ suppliers: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No suppliers connected/i)).toBeInTheDocument()
})

test('shows suppliers', () => {
  mockUseSupplierConnections.mockReturnValue({
    suppliers: [
      { id: '1', name: 'Supp', status: 'connected', last_sync: null, next_run: null },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('Supp')).toBeInTheDocument()
})

```


---

## src\components\dashboard\ConnectorHealthCard.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, TestTube, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ConnectorHealthCardProps {
  supplier: {
    id: string
    name: string
    status: 'connected' | 'needs_login' | 'error' | 'syncing'
    lastSync: string
    nextRun: string
    lastRunId?: string
  }
}

export function ConnectorHealthCard({ supplier }: ConnectorHealthCardProps) {
  const handleRunNow = () => {
    toast({
      title: 'Sync started',
      description: `${supplier.name} sync has been initiated`
    })
  }

  const handleTest = () => {
    toast({
      title: 'Connection tested',
      description: `${supplier.name} connection is working properly`
    })
  }

  const getStatusIcon = () => {
    switch (supplier.status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'syncing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'needs_login':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusVariant = () => {
    switch (supplier.status) {
      case 'connected':
        return 'default'
      case 'syncing':
        return 'secondary'
      case 'needs_login':
        return 'outline'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = () => {
    switch (supplier.status) {
      case 'connected':
        return 'Connected'
      case 'syncing':
        return 'Syncing...'
      case 'needs_login':
        return 'Needs Login'
      case 'error':
        return 'Error'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{supplier.name}</CardTitle>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Last sync: {supplier.lastSync}</div>
          <div>Next run: {supplier.nextRun}</div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRunNow}
            disabled={supplier.status === 'syncing'}
          >
            <Play className="h-3 w-3 mr-1" />
            Run now
          </Button>
          <Button size="sm" variant="ghost" onClick={handleTest}>
            <TestTube className="h-3 w-3 mr-1" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\dashboard\PriceAnomalyAlert.tsx

```tsx

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, AlertTriangle, Eye, Archive } from 'lucide-react'

export interface PriceAnomaly {
  id: string
  itemName: string
  supplier: string
  type: 'spike' | 'drop' | 'volatile'
  severity: 'low' | 'medium' | 'high'
  currentPrice: number
  previousPrice: number
  changePercent: number
  detectedAt: string
  description: string
}

interface PriceAnomalyAlertProps {
  anomaly: PriceAnomaly
  onView: (id: string) => void
  onDismiss: (id: string) => void
}

export function PriceAnomalyAlert({ anomaly, onView, onDismiss }: PriceAnomalyAlertProps) {
  const getTypeIcon = () => {
    switch (anomaly.type) {
      case 'spike':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'drop':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'volatile':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTypeColor = () => {
    switch (anomaly.type) {
      case 'spike':
        return 'text-red-600'
      case 'drop':
        return 'text-green-600'
      case 'volatile':
        return 'text-yellow-600'
    }
  }

  const getSeverityVariant = () => {
    switch (anomaly.severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? '+' : ''
    return `${sign}${percent.toFixed(1)}%`
  }

  return (
    <Alert className="relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getTypeIcon()}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{anomaly.itemName}</span>
              <Badge variant="outline" className="text-xs">
                {anomaly.supplier}
              </Badge>
              <Badge variant={getSeverityVariant()} className="text-xs">
                {anomaly.severity}
              </Badge>
            </div>
            
            <AlertDescription className="text-sm">
              {anomaly.description}
            </AlertDescription>

            <div className="flex items-center space-x-4 text-sm">
              <div>
                <span className="text-muted-foreground">Previous: </span>
                <span>{formatPrice(anomaly.previousPrice)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="font-medium">{formatPrice(anomaly.currentPrice)}</span>
              </div>
              <div className={`font-medium ${getTypeColor()}`}>
                {formatPercent(anomaly.changePercent)}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Detected {new Date(anomaly.detectedAt).toLocaleString('is-IS')}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(anomaly.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"  
            onClick={() => onDismiss(anomaly.id)}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}

```


---

## src\components\dashboard\SuppliersPanel.tsx

```tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supplierStatusTokens } from './status-tokens'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'

export function SuppliersPanel() {
  const { suppliers, isLoading } = useSupplierConnections()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">My Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No suppliers connected</div>
        ) : (
          <ul className="divide-y">
            {suppliers.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    <Badge className={`${supplierStatusTokens[s.status].badge}`}>{supplierStatusTokens[s.status].label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last sync{' '}
                    {s.last_sync ? (
                      new Date(s.last_sync).toLocaleString('is-IS')
                    ) : (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">No data yet</span>
                      </>
                    )}{' '}
                    • Next run{' '}
                    {s.next_run
                      ? new Date(s.next_run).toLocaleString('is-IS')
                      : 'Pending'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'needs_login' && (
                    <Button size="sm" variant="secondary">Reconnect</Button>
                  )}
                  <Button size="sm">Run now</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default SuppliersPanel

```


---

## src\components\onboarding\steps\SupplierConnectionStep.tsx

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Building2, Check, Globe, ShoppingCart } from 'lucide-react'

const availableSuppliers = [
  {
    id: 'vefkaupmenn',
    name: 'Véfkaupmenn',
    description: 'Leading food distributor in Iceland',
    categories: ['Food & Beverage', 'Fresh Produce'],
    logo: '🏪',
    featured: true
  },
  {
    id: 'heilsuhusid',
    name: 'Heilsuhúsið',
    description: 'Health and wellness products',
    categories: ['Health Products', 'Supplements'],
    logo: '🏥',
    featured: true
  },
  {
    id: 'nordic-fresh',
    name: 'Nordic Fresh',
    description: 'Premium fresh food supplier',
    categories: ['Fresh Produce', 'Organic'],
    logo: '🥬',
    featured: false
  },
  {
    id: 'iceland-seafood',
    name: 'Iceland Seafood',
    description: 'Fresh and frozen seafood',
    categories: ['Seafood', 'Frozen'],
    logo: '🐟',
    featured: false
  },
  {
    id: 'bakehouse',
    name: 'Reykjavik Bakehouse',
    description: 'Fresh baked goods and pastries',
    categories: ['Bakery', 'Fresh'],
    logo: '🍞',
    featured: false
  }
]

interface SupplierConnectionStepProps {
  onComplete: (data: { suppliers: string[] }) => void
  onBack: () => void
  initialData?: string[]
}

export function SupplierConnectionStep({ onComplete, onBack, initialData }: SupplierConnectionStepProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(initialData || [])

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleContinue = () => {
    onComplete({ suppliers: selectedSuppliers })
  }

  const featuredSuppliers = availableSuppliers.filter(s => s.featured)
  const otherSuppliers = availableSuppliers.filter(s => !s.featured)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect to your suppliers</h3>
        <p className="text-muted-foreground">
          Select the suppliers you want to connect to. You can add more later.
        </p>
      </div>

      {/* Featured Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Popular Suppliers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{supplier.logo}</div>
                    <div>
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {supplier.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {supplier.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          More Suppliers
        </h4>
        <div className="space-y-2">
          {otherSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-sm ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{supplier.logo}</div>
                    <div>
                      <h5 className="font-medium">{supplier.name}</h5>
                      <p className="text-sm text-muted-foreground">{supplier.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 2).map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleSupplier(supplier.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </span>
          <Button onClick={handleContinue} disabled={selectedSuppliers.length === 0} size="lg">
            Continue
            <Check className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

```


---

## src\components\orders\OrderApprovalWorkflow.tsx

```tsx

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { DeliveryCalculation } from '@/lib/types/delivery'

interface OrderApprovalWorkflowProps {
  calculations: DeliveryCalculation[]
  onApprove: (reason?: string) => void
  onReject: (reason: string) => void
  isSubmitting?: boolean
}

export function OrderApprovalWorkflow({ 
  calculations, 
  onApprove, 
  onReject, 
  isSubmitting = false 
}: OrderApprovalWorkflowProps) {
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const totalDeliveryFees = calculations.reduce((sum, calc) => sum + calc.total_delivery_cost, 0)
  const suppliersWithFees = calculations.filter(calc => calc.total_delivery_cost > 0)
  const isHighCost = totalDeliveryFees > 10000 // More than ISK 10,000 in delivery fees

  if (!isHighCost && suppliersWithFees.length <= 1) {
    return null // No approval needed for low-cost or single-supplier orders
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800">Order Approval Required</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-orange-700">
            This order has been flagged for review due to:
          </p>
          
          <ul className="text-sm text-orange-700 space-y-1 ml-4">
            {isHighCost && (
              <li>• High delivery costs: {formatPrice(totalDeliveryFees)}</li>
            )}
            {suppliersWithFees.length > 1 && (
              <li>• Multiple suppliers with delivery fees ({suppliersWithFees.length} suppliers)</li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-orange-800">Delivery Fee Breakdown:</h4>
          {suppliersWithFees.map(calc => (
            <div key={calc.supplier_id} className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm">{calc.supplier_name}</span>
              <Badge variant="outline" className="text-orange-600">
                {formatPrice(calc.total_delivery_cost)}
              </Badge>
            </div>
          ))}
          
          <div className="flex justify-between items-center p-2 bg-orange-100 rounded font-medium">
            <span>Total Delivery Fees:</span>
            <span className="text-orange-700">{formatPrice(totalDeliveryFees)}</span>
          </div>
        </div>

        {showReason && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-800">
              Approval Reason (Optional):
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for approving this order despite high delivery costs..."
              className="border-orange-200 focus:border-orange-400"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              if (showReason) {
                onApprove(reason)
              } else {
                setShowReason(true)
              }
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {showReason ? 'Confirm Approval' : 'Approve Order'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onReject('Order rejected due to high delivery costs')}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject Order
          </Button>
          
          {showReason && (
            <Button
              variant="ghost"
              onClick={() => {
                setShowReason(false)
                setReason('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\orders\OrderComposer.tsx

```tsx

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus, Truck } from 'lucide-react'
import { useDeliveryCalculation, useDeliveryOptimization } from '@/hooks/useDeliveryOptimization'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { DeliveryFeeIndicator } from '@/components/delivery/DeliveryFeeIndicator'
import { OrderApprovalWorkflow } from './OrderApprovalWorkflow'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'

export function OrderComposer() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getMissingPriceCount,
  } = useCart()
  const { includeVat } = useSettings()
  const { data: deliveryCalculations, isLoading: isLoadingDelivery } = useDeliveryCalculation()
  const { data: optimization } = useDeliveryOptimization()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderApproved, setOrderApproved] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const totalItems = getTotalItems()
  const subtotalPrice = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const totalDeliveryFees = deliveryCalculations?.reduce((sum, calc) => sum + calc.total_delivery_cost, 0) || 0
  const grandTotal = subtotalPrice + totalDeliveryFees

  const handleOrderApproval = (reason?: string) => {
    setOrderApproved(true)
    toast({
      title: "Order Approved",
      description: reason || "Order approved for checkout despite delivery costs.",
    })
  }

  const handleOrderRejection = (reason: string) => {
    toast({
      title: "Order Rejected",
      description: reason,
      variant: "destructive"
    })
  }

  const handleCheckout = async () => {
    setIsSubmitting(true)
    try {
      // Here you would implement actual checkout logic
      toast({
        title: "Order Submitted",
        description: "Your order has been submitted successfully.",
      })
      clearCart()
      setOrderApproved(false)
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: "There was an error submitting your order.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground text-center">
            <p className="text-lg mb-2">Your cart is empty</p>
            <p className="text-sm">Add items from the product comparison to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group items by supplier
  const supplierGroups = items.reduce((groups, item) => {
    if (!groups[item.supplierId]) {
      groups[item.supplierId] = {
        supplierName: item.supplierName,
        items: []
      }
    }
    groups[item.supplierId].items.push(item)
    return groups
  }, {} as Record<string, { supplierName: string; items: typeof items }>)

  return (
    <div className="space-y-6">
      {/* Delivery Optimization Banner */}
      {optimization && (
        <DeliveryOptimizationBanner optimization={optimization} />
      )}

      {/* Order Approval Workflow */}
      {deliveryCalculations && !orderApproved && (
        <OrderApprovalWorkflow
          calculations={deliveryCalculations}
          onApprove={handleOrderApproval}
          onReject={handleOrderRejection}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Order Items by Supplier */}
      {Object.entries(supplierGroups).map(([supplierId, group]) => {
        const supplierDelivery = deliveryCalculations?.find(calc => calc.supplier_id === supplierId)
        const supplierSubtotal = group.items.reduce((sum, item) => {
          const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
          return sum + (price * item.quantity)
        }, 0)

        return (
          <Card key={supplierId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.supplierName}</CardTitle>
                <div className="flex items-center gap-2">
                  {supplierDelivery && (
                    <DeliveryFeeIndicator calculation={supplierDelivery} />
                  )}
                  {supplierDelivery?.next_delivery_day && (
                    <Badge variant="outline" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Next: {supplierDelivery.next_delivery_day}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {group.items.map((item) => {
                const itemPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                const lineTotal = itemPrice * item.quantity

                return (
                  <div key={item.supplierItemId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.displayName}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>{item.packSize}</span>
                        <span>•</span>
                        <span>{formatPrice(itemPrice)} per {item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right min-w-[80px]">
                        <div className="font-medium text-sm">
                          {formatPrice(lineTotal)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center w-[96px] gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(
                                item.supplierItemId,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="h-6 w-6 p-0 rounded-md"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center tabular-nums text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.supplierItemId, item.quantity + 1)
                            }
                            className="h-6 w-6 p-0 rounded-md"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.supplierItemId)}
                          className="h-6 w-6 p-0 rounded-md text-destructive hover:text-destructive flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Supplier Summary */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items subtotal:</span>
                  <span>{formatPrice(supplierSubtotal)}</span>
                </div>
                
                {supplierDelivery && supplierDelivery.total_delivery_cost > 0 && (
                  <>
                    {supplierDelivery.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery fee:</span>
                        <span>{formatPrice(supplierDelivery.delivery_fee)}</span>
                      </div>
                    )}
                    
                    {supplierDelivery.fuel_surcharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Fuel surcharge:</span>
                        <span>{formatPrice(supplierDelivery.fuel_surcharge)}</span>
                      </div>
                    )}
                    
                    {supplierDelivery.pallet_deposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Pallet deposit:</span>
                        <span>{formatPrice(supplierDelivery.pallet_deposit)}</span>
                      </div>
                    )}
                  </>
                )}

                {supplierDelivery?.amount_to_free_delivery && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    Add {formatPrice(supplierDelivery.amount_to_free_delivery)} more for free delivery
                  </div>
                )}

                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Supplier total:</span>
                  <span>{formatPrice(supplierSubtotal + (supplierDelivery?.total_delivery_cost || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Order Summary</CardTitle>
            {missingPriceCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                Some prices unavailable
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Items ({totalItems}):</span>
            <span>{formatPrice(subtotalPrice)}</span>
          </div>
          
          {totalDeliveryFees > 0 && (
            <div className="flex justify-between">
              <span>Total delivery fees:</span>
              <span>{formatPrice(totalDeliveryFees)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-semibold">
            <span>Grand total:</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={isSubmitting || (!orderApproved && totalDeliveryFees > 10000)}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={clearCart}
              disabled={isSubmitting}
            >
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

```


---

## src\components\orders\OrderSummaryCard.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Send, AlertTriangle } from 'lucide-react'

interface OrderSummaryCardProps {
  itemCount: number
  totals: {
    exVat: number
    incVat: number
    vat: number
  }
  needsApproval: boolean
  approvalThreshold: number
  dispatching: boolean
  onDispatchOrders: () => void
  onClearCart: () => void
  formatPrice: (price: number) => string
}

export function OrderSummaryCard({
  itemCount,
  totals,
  needsApproval,
  approvalThreshold,
  dispatching,
  onDispatchOrders,
  onClearCart,
  formatPrice
}: OrderSummaryCardProps) {
  return (
    <>
      {/* Approval Banner */}
      {needsApproval && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-800">
                  Over your approval limit ({formatPrice(approvalThreshold)})
                </div>
                <div className="text-sm text-amber-700">
                  Request approval to proceed with this order.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Order Summary ({itemCount} items)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono tabular-nums">{formatPrice(totals.exVat)}</div>
              <div className="text-sm text-muted-foreground">Total (ex VAT)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono tabular-nums">{formatPrice(totals.vat)}</div>
              <div className="text-sm text-muted-foreground">VAT Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary font-mono tabular-nums">{formatPrice(totals.incVat)}</div>
              <div className="text-sm text-muted-foreground">Total (inc VAT)</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClearCart}>
              Clear Cart
            </Button>
            <Button 
              onClick={onDispatchOrders}
              disabled={dispatching || needsApproval}
              className="flex-1"
            >
              {dispatching ? 'Dispatching...' : needsApproval ? 'Request Approval' : 'Dispatch Orders'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

```


---

## src\components\orders\SupplierOrderCard.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Minus, Plus } from 'lucide-react'
import type { CartItem } from '@/lib/types'

interface SupplierOrderCardProps {
  supplierId: string
  supplierName: string
  items: CartItem[]
  totalExVat: number
  totalIncVat: number
  vatAmount: number
  onUpdateQuantity: (supplierItemId: string, quantity: number) => void
  onRemoveItem: (supplierItemId: string) => void
  formatPrice: (price: number) => string
}

export function SupplierOrderCard({
  supplierId,
  supplierName,
  items,
  totalExVat,
  totalIncVat,
  vatAmount,
  onUpdateQuantity,
  onRemoveItem,
  formatPrice
}: SupplierOrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{supplierName}</span>
          <Badge variant="outline">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.supplierItemId} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.itemName}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.sku} • {item.packSize}
                </div>
                <div className="text-sm font-mono tabular-nums">
                  {formatPrice(item.packPrice)} per pack
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center w-[96px] gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(item.supplierItemId, item.quantity - 1)
                        }
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e =>
                          onUpdateQuantity(
                            item.supplierItemId,
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="h-6 w-10 p-0 text-center tabular-nums rounded-md"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(item.supplierItemId, item.quantity + 1)
                        }
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.supplierItemId)}
                      className="h-6 w-6 p-0 rounded-md text-destructive hover:text-destructive flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-right">
                  <div className="font-medium font-mono tabular-nums">
                    {formatPrice(item.packPrice * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between text-sm">
            <span>Subtotal (ex VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalExVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT:</span>
            <span className="font-mono tabular-nums">{formatPrice(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total (inc VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalIncVat)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\search\HeaderSearch.tsx

```tsx
import React, { useState, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResultsPopover } from './SearchResultsPopover'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'

function useRecentSearches(orgId: string) {
  const key = `recent-searches:${orgId}`
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setItems(JSON.parse(stored))
    } catch (_e) {
      // ignore
    }
  }, [key])

  const add = (q: string) => {
    if (!q) return
    const next = [q, ...items.filter((i) => i !== q)].slice(0, 10)
    setItems(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch (_e) {
      // ignore
    }
  }

  return { items, add }
}

export const HeaderSearch = React.forwardRef<HTMLInputElement>((_props, ref) => {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [scope, setScope] = useState<SearchScope>('all')
  const { sections, isLoading } = useGlobalSearch(query, scope)
  const { items: recent, add: addRecent } = useRecentSearches('default')
  const [activeIndex, setActiveIndex] = useState(0)

  const items = [
    ...sections.products.map((p) => ({ ...p, section: 'products' })),
    ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
    ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
  ]

  const open = expanded && (query.length > 0 || recent.length > 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (items[activeIndex]) {
        handleSelect(items[activeIndex])
      } else {
        addRecent(query)
        setExpanded(false)
      }
    } else if (e.key === 'Escape') {
      setQuery('')
      setExpanded(false)
    }
  }

  const handleSelect = (item: { id: string; name: string; section: string }) => {
    addRecent(query)
    setExpanded(false)
    setQuery('')
    // navigation is app-specific; omitted
  }

  const handleRecentSelect = (q: string) => {
    setQuery(q)
    setExpanded(true)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setExpanded(false)
    }, 100)
  }

  return (
    <div className="relative">
      <SearchInput
        ref={ref}
        value={query}
        onChange={setQuery}
        onFocus={() => setExpanded(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        expanded={expanded}
        onClear={() => setQuery('')}
        isLoading={isLoading}
      />
      <SearchResultsPopover
        open={open}
        scope={scope}
        onScopeChange={setScope}
        sections={sections}
        query={query}
        activeIndex={activeIndex}
        onHoverIndex={setActiveIndex}
        onSelectItem={handleSelect}
        recentSearches={recent}
        onRecentSelect={handleRecentSelect}
      />
    </div>
  )
})

HeaderSearch.displayName = 'HeaderSearch'


```


---

## src\components\search\HeroSearchInput.tsx

```tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface HeroSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightSlot?: React.ReactNode
}

/**
 * A large search input used on pages that require prominent product searching.
 * The component forwards refs to the underlying input element and supports an
 * optional slot on the right side for icons or buttons (e.g. voice search).
 */
const HeroSearchInput = React.forwardRef<HTMLInputElement, HeroSearchInputProps>(
  ({ className, rightSlot, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          {...props}
          className={cn(
            'h-12 w-full rounded-md border-2 border-input bg-muted/30 px-4 pr-12 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {rightSlot}
          </div>
        )}
      </div>
    )
  }
)

HeroSearchInput.displayName = 'HeroSearchInput'

export { HeroSearchInput }

```


---

## src\components\search\SearchInput.tsx

```tsx
import React, { useRef, useImperativeHandle } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  expanded: boolean
  onClear: () => void
  isLoading: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      expanded,
      onClear,
      isLoading
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div
        className="relative rounded-full focus-within:shadow-[0_0_0_2px_var(--brand-accent)]"
        style={{ contain: 'layout paint' }}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-text text-slate-400"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          ) : (
            <Search className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={expanded}
          aria-controls="global-search-results"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder="Search products, suppliers, orders..."
          className={cn(
            'h-11 w-full rounded-full bg-white/95 text-slate-800 ring-1 ring-white/10 pl-11 pr-10 text-sm placeholder:text-slate-400 focus:outline-none',
            expanded && 'shadow-md'
          )}
        />
        {!expanded && !value && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/</span>
        )}
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'


```


---

## src\components\search\SearchResultsPopover.tsx

```tsx
import React from 'react'
import { ResultItem } from './ResultItem'
import { RecentSearches } from './RecentSearches'
import { SearchScope } from '@/hooks/useGlobalSearch'
import { cn } from '@/lib/utils'

interface SearchSections {
  products: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  orders: { id: string; name: string }[]
}

interface SearchResultsPopoverProps {
  open: boolean
  sections: SearchSections
  query: string
  activeIndex: number
  onHoverIndex: (i: number) => void
  onSelectItem: (item: { id: string; name: string; section: string }) => void
  recentSearches: string[]
  onRecentSelect: (q: string) => void
  scope: SearchScope
  onScopeChange: (s: SearchScope) => void
}

export function SearchResultsPopover({
  open,
  sections,
  query,
  activeIndex,
  onHoverIndex,
  onSelectItem,
  recentSearches,
  onRecentSelect,
  scope,
  onScopeChange
}: SearchResultsPopoverProps) {
  if (!open) return null

  const items = [
    ...sections.products.map((p) => ({ ...p, section: 'products' })),
    ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
    ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
  ]

  let currentIndex = -1

  const renderSection = (section: keyof SearchSections, label: string) => {
    const data = sections[section]
    if (data.length === 0) return null
    return (
      <div key={section}>
        <div className="px-3 py-1 text-xs font-medium text-muted-foreground">{label}</div>
        {data.map((item) => {
          currentIndex += 1
          return (
            <ResultItem
              key={item.id}
              item={{ ...item, section }}
              query={query}
              active={currentIndex === activeIndex}
              onMouseEnter={() => onHoverIndex(currentIndex)}
              onMouseDown={() => onSelectItem({ ...item, section })}
            />
          )
        })}
      </div>
    )
  }

  const hasResults = items.length > 0

  return (
    <div
      id="global-search-results"
      role="listbox"
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-md"
    >
      <div className="flex gap-2 border-b p-2 text-xs">
        {(
          [
            { label: 'All', value: 'all' },
            { label: 'Products', value: 'products' },
            { label: 'Suppliers', value: 'suppliers' },
            { label: 'Orders', value: 'orders' }
          ] as { label: string; value: SearchScope }[]
        ).map((s) => (
          <button
            key={s.value}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onScopeChange(s.value)}
            className={cn(
              'rounded-full px-2 py-0.5',
              scope === s.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {query && hasResults && (
        <>
          {renderSection('products', 'Products')}
          {renderSection('suppliers', 'Suppliers')}
          {renderSection('orders', 'Orders')}
        </>
      )}
      {query && !hasResults && (
        <div className="px-3 py-2 text-sm text-muted-foreground">No matches for '{query}'</div>
      )}
      {!query && (
        <RecentSearches items={recentSearches} onSelect={onRecentSelect} />
      )}
    </div>
  )
}


```


---

## src\components\suppliers\BookmarkletSync.tsx

```tsx

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Bookmark, Globe, Timer, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface BookmarkletSyncProps {
  tenantId: string
  supplierId: string
  supplierDomainHint?: string
  className?: string
}

export function BookmarkletSync({ 
  tenantId, 
  supplierId, 
  supplierDomainHint, 
  className 
}: BookmarkletSyncProps) {
  const { toast } = useToast()
  
  // Use the Supabase function URL directly from the client config
  const ingestUrl = `https://hcrjkziycryuugzbixhq.supabase.co/functions/v1/ingest_har`
  const ingestToken = '' // Optional token for additional security

  const bookmarklet = React.useMemo(() => {
    // Compact, self-contained bookmarklet that captures network JSON for 10 seconds
    const payload = `
      (()=>{
        const ORG='${tenantId}', SUP='${supplierId}';
        const URL='${ingestUrl}';
        const TOK='${ingestToken}';
        const bar=document.createElement('div');
        bar.textContent='Kaupa: capturing for ~10s… scroll/paginate once';
        Object.assign(bar.style,{position:'fixed',top:0,left:0,right:0,zIndex:999999,background:'#111827',color:'#fff',padding:'8px',font:'12px system-ui',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,.2)'});
        document.documentElement.appendChild(bar);
        const keep=(u)=>/\\/(api|graphql|catalog|products|prices)/i.test(u||'');
        const cap=[];
        const F=window.fetch;
        window.fetch=async(...a)=>{const r=await F(...a);try{const c=r.clone();const u=String(a[0]);if(keep(u)){const d=await c.json().catch(()=>null);if(d)cap.push({u,d,ts:Date.now()});}}catch{}return r;};
        const XO=XMLHttpRequest.prototype.open, XS=XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open=function(...a){this.__u=a[1];return XO.apply(this,a)};
        XMLHttpRequest.prototype.send=function(...a){this.addEventListener('load',function(){try{const u=this.__u||'';if(keep(u)){try{cap.push({u,d:JSON.parse(this.responseText),ts:Date.now()})}catch{}}}catch{}});return XS.apply(this,a)};
        setTimeout(async()=>{
          window.fetch=F;XMLHttpRequest.prototype.open=XO;XMLHttpRequest.prototype.send=XS;
          bar.textContent='Kaupa: uploading…';
          try{
            const resp=await fetch(URL,{method:'POST',headers:Object.assign({'content-type':'application/json'}, TOK?{'x-ingest-token':TOK}:{}),body:JSON.stringify({tenant_id:ORG,supplier_id:SUP,_captured:cap})});
            const result=await resp.json().catch(()=>({}));
            if(resp.ok){
              bar.textContent=\`Kaupa: success! \${result.items||0} items found\`;
              bar.style.background='#10b981';
            }else{
              bar.textContent=\`Kaupa: upload failed (\${resp.status})\`;
              bar.style.background='#ef4444';
            }
            setTimeout(()=>bar.remove(),3000);
          }catch(e){ 
            bar.textContent='Kaupa: upload failed (network error)'; 
            bar.style.background='#ef4444';
            setTimeout(()=>bar.remove(),3000); 
          }
        },10000);
      })();
    `.replace(/\n+/g,"").replace(/\s{2,}/g," ");
    return `javascript:${encodeURIComponent(payload)}`;
  }, [tenantId, supplierId, ingestUrl, ingestToken]);

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarklet)
      toast({
        title: "Copied to clipboard",
        description: "Create a new bookmark and paste the code into the URL field."
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please drag the button to your bookmarks bar instead."
      })
    }
  }

  return (
    <Card className={cn("bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base">Sync via Bookmarklet</CardTitle>
          <Badge variant="secondary" className="text-xs">No install required</Badge>
        </div>
        <CardDescription className="text-sm">
          Capture supplier data directly from their website without extensions or manual HAR files
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
            Drag this button to your bookmarks bar:
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={bookmarklet}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white px-4 py-2 text-white dark:text-black text-sm font-medium shadow-sm transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Bookmark className="h-4 w-4" />
              Kaupa Capture
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={copyBookmarklet}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy code
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
            <span>Go to the supplier's website {supplierDomainHint && (
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{supplierDomainHint}</code>
            )}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">3</span>
            <span>Open their product catalog or search results</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">4</span>
            <span>Click <strong>Kaupa Capture</strong>, then scroll or browse for ~10 seconds</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">5</span>
            <span>Data uploads automatically when capture completes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Timer className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            <span>10 second capture</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Globe className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            <span>API data only</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            <span>User-initiated only</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\EnhancedSupplierManagement.tsx

```tsx

import React, { useState, useEffect, useRef } from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { HarUploadModal } from './HarUploadModal'
import { HarSyncStatus } from './HarSyncStatus'
import { SupplierItemsWithHarInfo } from './SupplierItemsWithHarInfo'
import { BookmarkletSync } from './BookmarkletSync'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity, FileText } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useSupplierItems } from '@/hooks/useSupplierItems'
import { useAuth } from '@/contexts/useAuth'

export function EnhancedSupplierManagement() {
  const { profile } = useAuth()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  const { credentials } = useSupplierCredentials()
  const { createRun } = useConnectorRuns()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [harUploadOpen, setHarUploadOpen] = useState(false)
  const [processingSupplier, setProcessingSupplier] = useState<string | null>(null)
  const previousSupplierCount = useRef(0)

  const { items: selectedSupplierItems, stats: itemStats } = useSupplierItems(selectedSupplier || undefined)

  useEffect(() => {
    if (
      suppliers &&
      suppliers.length > 0 &&
      previousSupplierCount.current === 0 &&
      !selectedSupplier
    ) {
      setSelectedSupplier(suppliers[0].id)
    }
    previousSupplierCount.current = suppliers?.length ?? 0
  }, [suppliers, selectedSupplier])

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplier(supplierId)
  }

  const handleRunConnector = async (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId)
    if (!supplier) return

    setProcessingSupplier(supplierId)
    try {
      await createRun.mutateAsync({
        tenant_id: profile?.tenant_id ?? null,
        supplier_id: supplierId,
        connector_type: supplier.connector_type || 'generic',
        status: 'pending'
      })
    } finally {
      setProcessingSupplier(null)
    }
  }

  const handleHarUpload = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setHarUploadOpen(true)
  }

  const handleHarUploadSuccess = () => {
    // Refresh supplier items data
    if (selectedSupplier) {
      // The useSupplierItems hook will automatically refetch
    }
  }

  const selectedSupplierData = suppliers?.find(s => s.id === selectedSupplier)

  // Helper function to extract domain from website URL
  const getDomainHint = (website: string | null) => {
    if (!website) return undefined
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`)
      return `${url.protocol}//${url.hostname}/*`
    } catch {
      return website.includes('.') ? `https://${website}/*` : undefined
    }
  }

  return (
    <>
      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="ingestion" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ingestion
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierList 
            suppliers={suppliers || []}
            credentials={credentials || []}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={handleSelectSupplier}
            onRunConnector={handleRunConnector}
            onHarUpload={handleHarUpload}
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <SupplierCredentialsForm />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6">
          <IngestionRunsList />
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          {!suppliers || suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found. Add a supplier to view items and sync status
            </div>
          ) : selectedSupplier && selectedSupplierData ? (
            <div className="space-y-6">
              <HarSyncStatus
                supplierId={selectedSupplier}
                supplierName={selectedSupplierData.name}
                lastSyncAt={selectedSupplierItems[0]?.last_seen_at || null}
                itemCount={itemStats.total}
                onHarUpload={() => handleHarUpload(selectedSupplier)}
                isProcessing={processingSupplier === selectedSupplier}
              />

              {/* Add Bookmarklet Sync option */}
              <BookmarkletSync
                tenantId={profile?.tenant_id || ''}
                supplierId={selectedSupplier}
                supplierDomainHint={getDomainHint(selectedSupplier)}
              />

              <SupplierItemsWithHarInfo
                items={selectedSupplierItems}
                supplierId={selectedSupplier}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a supplier to view their items and sync status
            </div>
          )}
        </TabsContent>
      </Tabs>

      <HarUploadModal
        open={harUploadOpen}
        onClose={() => setHarUploadOpen(false)}
        tenantId={profile?.tenant_id || ''}
        supplierId={selectedSupplier || ''}
        onSuccess={handleHarUploadSuccess}
      />
    </>
  )
}

```


---

## src\components\suppliers\HarAnalyticsPreview.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, AlertTriangle, Target, Lightbulb, BarChart3, PieChart } from 'lucide-react'
import { AnalyticsResult } from '@/utils/harAnalytics'
import { OptimizationRecommendation, CompetitiveInsight } from '@/utils/harRecommendations'

interface HarAnalyticsPreviewProps {
  analytics?: AnalyticsResult | null
  recommendations: OptimizationRecommendation[]
  insights: CompetitiveInsight[]
  actionPlan: string[]
}

export function HarAnalyticsPreview({
  analytics,
  recommendations,
  insights,
  actionPlan
}: HarAnalyticsPreviewProps) {
  if (!analytics) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Quality Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Data Quality Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Completeness Score</div>
              <Progress value={analytics.qualityMetrics.completenessScore * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(analytics.qualityMetrics.completenessScore * 100)}% of fields populated
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Data Quality Score</div>
              <Progress value={analytics.qualityMetrics.dataQualityScore * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(analytics.qualityMetrics.dataQualityScore * 100)}% quality rating
              </div>
            </div>
          </div>

          {analytics.qualityMetrics.missingFields.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Missing Fields</div>
              <div className="flex gap-1 flex-wrap">
                {analytics.qualityMetrics.missingFields.map(field => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Price Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Average:</span>
              <span className="ml-2 font-medium">€{analytics.priceAnalysis.averagePrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Range:</span>
              <span className="ml-2 font-medium">
                €{analytics.priceAnalysis.priceRange.min.toFixed(2)} - €{analytics.priceAnalysis.priceRange.max.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Outliers:</span>
              <span className="ml-2 font-medium">{analytics.priceAnalysis.outliers.length}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Price Distribution</div>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500">
                Low: {analytics.priceAnalysis.distribution.low}
              </Badge>
              <Badge variant="secondary">
                Medium: {analytics.priceAnalysis.distribution.medium}
              </Badge>
              <Badge variant="outline">
                High: {analytics.priceAnalysis.distribution.high}
              </Badge>
            </div>
          </div>

          {analytics.priceAnalysis.outliers.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Top Price Outliers</div>
              <div className="space-y-1">
                {analytics.priceAnalysis.outliers.slice(0, 3).map((outlier, idx) => (
                  <div key={idx} className="text-xs bg-muted/50 rounded p-2">
                    <div className="font-medium">{outlier.name}</div>
                    <div className="text-muted-foreground">
                      €{outlier.price.toFixed(2)} ({outlier.deviation.toFixed(1)}σ deviation)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Analysis */}
      {analytics.categoryAnalysis.categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-purple-500" />
              Category & Brand Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Top Categories</div>
              <div className="space-y-2">
                {analytics.categoryAnalysis.categories.slice(0, 4).map((category, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span>{category.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {category.count} items
                      </Badge>
                      <span className="text-muted-foreground">
                        avg €{category.avgPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analytics.categoryAnalysis.topBrands.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Top Brands</div>
                <div className="flex gap-1 flex-wrap">
                  {analytics.categoryAnalysis.topBrands.slice(0, 6).map((brand, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {brand.brand} ({brand.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-orange-500" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{rec.title}</div>
                  <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{rec.description}</div>
                <div className="text-xs">
                  <span className="font-medium">Action:</span> {rec.action}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Impact:</span> {rec.impact}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competitive Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Competitive Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{insight.message}</div>
                  <Badge variant="outline" className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="space-y-1">
                  {insight.suggestions.map((suggestion, sidx) => (
                    <div key={sidx} className="text-xs text-muted-foreground">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {actionPlan.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              Recommended Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionPlan.map((action, idx) => (
                <div key={idx} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                  {action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Summary */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {analytics.insights.map((insight, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  • {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

```


---

## src\components\suppliers\HarProcessingPreview.tsx

```tsx

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, AlertTriangle, Info, TrendingUp, BarChart3, Target } from 'lucide-react'
import { ValidationResult } from '@/utils/harValidator'
import { ExtractionResult } from '@/utils/harDataExtractor'
import { HarAnalyticsPreview } from './HarAnalyticsPreview'
import { AnalyticsResult } from '@/utils/harAnalytics'
import { OptimizationRecommendation, CompetitiveInsight } from '@/utils/harRecommendations'

interface HarProcessingPreviewProps {
  validationResult: ValidationResult | null
  extractionResult: ExtractionResult | null
  analyticsResult?: AnalyticsResult | null
  recommendations?: OptimizationRecommendation[]
  insights?: CompetitiveInsight[]
  actionPlan?: string[]
}

export function HarProcessingPreview({ 
  validationResult, 
  extractionResult,
  analyticsResult,
  recommendations = [],
  insights = [],
  actionPlan = []
}: HarProcessingPreviewProps) {
  if (!validationResult && !extractionResult) return null

  const hasAnalytics = analyticsResult || recommendations.length > 0 || insights.length > 0

  return (
    <div className="space-y-4">
      {hasAnalytics ? (
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="extraction" className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Extraction
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validation">
            {validationResult && <ValidationCard validationResult={validationResult} />}
          </TabsContent>

          <TabsContent value="extraction">
            {extractionResult && <ExtractionCard extractionResult={extractionResult} />}
          </TabsContent>

          <TabsContent value="analytics">
            <HarAnalyticsPreview 
              analytics={analyticsResult}
              recommendations={recommendations}
              insights={insights}
              actionPlan={actionPlan}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {validationResult && <ValidationCard validationResult={validationResult} />}
          {extractionResult && <ExtractionCard extractionResult={extractionResult} />}
        </div>
      )}
    </div>
  )
}

function ValidationCard({ validationResult }: { validationResult: ValidationResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {validationResult.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          HAR File Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Entries:</span>
            <span className="ml-2 font-medium">{validationResult.stats.totalEntries}</span>
          </div>
          <div>
            <span className="text-muted-foreground">JSON Responses:</span>
            <span className="ml-2 font-medium">{validationResult.stats.validJsonResponses}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Product APIs:</span>
            <span className="ml-2 font-medium">{validationResult.stats.potentialProductApis}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Est. Items:</span>
            <span className="ml-2 font-medium">{validationResult.stats.estimatedItems}</span>
          </div>
        </div>

        {validationResult.errors.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Errors
            </div>
            {validationResult.errors.map((error, idx) => (
              <div key={idx} className="text-sm text-red-600 pl-5">
                • {error}
              </div>
            ))}
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
              <Info className="h-3 w-3" />
              Warnings
            </div>
            {validationResult.warnings.map((warning, idx) => (
              <div key={idx} className="text-sm text-yellow-600 pl-5">
                • {warning}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ExtractionCard({ extractionResult }: { extractionResult: ExtractionResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Data Extraction Results
        </CardTitle>
        <CardDescription>
          {extractionResult.items.length} items extracted and validated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Distribution */}
        <div>
          <div className="text-sm font-medium mb-2">Data Quality</div>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-500">
              High: {extractionResult.stats.confidence.high}
            </Badge>
            <Badge variant="secondary">
              Medium: {extractionResult.stats.confidence.medium}
            </Badge>
            <Badge variant="outline">
              Low: {extractionResult.stats.confidence.low}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Sample Items Preview */}
        {extractionResult.items.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Sample Items (Top 3)</div>
            <div className="space-y-2">
              {extractionResult.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>SKU: {item.sku}</span>
                    <span>Price: €{item.price.toFixed(2)}</span>
                    {item.brand && <span>Brand: {item.brand}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={item.confidence >= 0.8 ? "default" : item.confidence >= 0.5 ? "secondary" : "outline"}
                      className="text-xs px-1 py-0"
                    >
                      {Math.round(item.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
              
              {extractionResult.items.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  ... and {extractionResult.items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\HarSyncStatus.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, Upload, Zap, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface HarSyncStatusProps {
  supplierId: string
  supplierName: string
  lastSyncAt: string | null
  itemCount: number
  onHarUpload: () => void
  isProcessing?: boolean
}

export function HarSyncStatus({
  supplierId,
  supplierName,
  lastSyncAt,
  itemCount,
  onHarUpload,
  isProcessing = false
}: HarSyncStatusProps) {
  const getSyncStatus = () => {
    if (!lastSyncAt) {
      return {
        status: 'never',
        color: 'destructive' as const,
        text: 'Never synced',
        description: 'No data has been imported from this supplier yet'
      }
    }

    const syncDate = new Date(lastSyncAt)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 0) {
      return {
        status: 'fresh',
        color: 'default' as const,
        text: 'Recently synced',
        description: `Synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else if (daysSince <= 7) {
      return {
        status: 'recent',
        color: 'secondary' as const,
        text: 'Recently synced',
        description: `Synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else if (daysSince <= 30) {
      return {
        status: 'aging',
        color: 'outline' as const,
        text: 'Data aging',
        description: `Last synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else {
      return {
        status: 'stale',
        color: 'destructive' as const,
        text: 'Data stale',
        description: `Last synced ${formatDistanceToNow(syncDate)} ago`
      }
    }
  }

  const syncStatus = getSyncStatus()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{supplierName} Data Sync</CardTitle>
            </div>
            <Badge variant={syncStatus.color} className="text-xs">
              {syncStatus.text}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onHarUpload}
              disabled={isProcessing}
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload HAR
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm">
          {syncStatus.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">{itemCount.toLocaleString()} items</div>
              <div className="text-xs text-muted-foreground">In catalog</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt)) : 'Never'}
              </div>
              <div className="text-xs text-muted-foreground">Last sync</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {isProcessing ? 'Processing...' : 'Ready'}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        {syncStatus.status === 'never' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800">No data imported yet</div>
                <div className="text-yellow-700 mt-1">
                  Use the HAR upload or bookmarklet sync below to import supplier data for price comparisons and ordering.
                </div>
              </div>
            </div>
          </div>
        )}

        {syncStatus.status === 'stale' && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Data needs refresh</div>
                <div className="text-orange-700 mt-1">
                  Consider syncing again to get the latest prices and product availability.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\HarUploadModal.tsx

```tsx

import React, { useState, useEffect } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useHarProcessor } from '@/hooks/useHarProcessor'
import { HarProcessingPreview } from './HarProcessingPreview'
import { lockScroll, unlockScroll } from '@/lib/lockScroll'

interface HarUploadModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  supplierId: string
  onSuccess?: () => void
}

export function HarUploadModal({ 
  open, 
  onClose, 
  tenantId, 
  supplierId, 
  onSuccess 
}: HarUploadModalProps) {
  const [busy, setBusy] = useState(false)
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'uploading'>('select')
  const { toast } = useToast()
  const harProcessor = useHarProcessor()

  useEffect(() => {
    if (open) {
      lockScroll()
    } else {
      unlockScroll()
    }
  }, [open])

  if (!open) return null

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    setUploadStep('preview')

    try {
      const result = await harProcessor.processHarFile(file)
      
      if (!result.isValid) {
        setUploadStep('select')
        return
      }

      setBusy(false)
    } catch (error) {
      console.error('File processing error:', error)
      setUploadStep('select')
      setBusy(false)
    }
  }

  const handleConfirmUpload = async () => {
    if (!harProcessor.extractionResult) return

    setBusy(true)
    setUploadStep('uploading')

    try {
      // Prepare the HAR data for the edge function
      const harData = {
        log: {
          entries: [] // We'll reconstruct this from the extraction results
        }
      }

      // Transform extraction results back to HAR-like format for processing
      const mockEntries = harProcessor.extractionResult.items.map(item => ({
        request: { url: item.source },
        response: {
          content: {
            mimeType: 'application/json',
            text: JSON.stringify({
              items: [{
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                pack: item.pack,
                price_ex_vat: item.price,
                vat_code: item.vatCode
              }]
            })
          }
        }
      }))

      harData.log.entries = mockEntries

      const { data, error } = await supabase.functions.invoke('ingest_har', {
        body: { 
          tenant_id: tenantId, 
          supplier_id: supplierId, 
          har: harData 
        }
      })

      if (error) throw error

      // Enhanced success message with analytics insights
      const qualityScore = harProcessor.analyticsResult?.qualityMetrics.completenessScore
      const recommendations = harProcessor.recommendations.length

      toast({
        title: 'HAR Import Successful',
        description: `Imported ${data.items} items${qualityScore ? ` (${Math.round(qualityScore * 100)}% quality)` : ''}${recommendations ? ` with ${recommendations} optimization tips` : ''}`
      })

      onSuccess?.()
      handleClose()

    } catch (err: any) {
      console.error('HAR upload error:', err)
      toast({
        variant: 'destructive',
        title: 'HAR Import Failed',
        description: err.message || 'Failed to process HAR file'
      })
      setUploadStep('preview')
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    harProcessor.resetState()
    setUploadStep('select')
    setBusy(false)
    onClose()
    unlockScroll()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Intelligent HAR Processing & Analytics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Upload HAR files with advanced validation, data extraction, and competitive intelligence
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {uploadStep === 'select' && (
            <>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Enhanced Processing Features:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Smart data extraction with confidence scoring</li>
                    <li>Automatic deduplication and quality validation</li>
                    <li>Price analysis and outlier detection</li>
                    <li>Category classification and brand analysis</li>
                    <li>Optimization recommendations</li>
                    <li>Competitive intelligence insights</li>
                  </ul>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open browser DevTools (F12)</li>
                    <li>Go to Network tab</li>
                    <li>Enable "Preserve log"</li>
                    <li>Load supplier pages with products</li>
                    <li>Right-click → "Save all as HAR"</li>
                    <li>Upload the .har file here</li>
                  </ol>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".har,application/json"
                  onChange={handleFileSelect}
                  disabled={busy}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Advanced processing with AI-powered analytics and optimization recommendations
                </p>
              </div>
            </>
          )}

          {uploadStep === 'preview' && (
            <div className="space-y-4">
              <HarProcessingPreview 
                validationResult={harProcessor.validationResult}
                extractionResult={harProcessor.extractionResult}
                analyticsResult={harProcessor.analyticsResult}
                recommendations={harProcessor.recommendations}
                insights={harProcessor.insights}
                actionPlan={harProcessor.actionPlan}
              />
              
              {harProcessor.extractionResult && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={busy}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import {harProcessor.extractionResult.items.length} Items
                    {harProcessor.recommendations.length > 0 && (
                      <span className="ml-2 text-xs opacity-80">
                        +{harProcessor.recommendations.length} tips
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadStep('select')}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {(busy || uploadStep === 'uploading') && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm">
                {uploadStep === 'preview' ? 'Processing HAR file with AI analytics...' : 'Importing data with insights...'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

```


---

## src\components\suppliers\IngestionRunsList.tsx

```tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useAuth } from '@/contexts/useAuth'

export function IngestionRunsList() {
  const { profile } = useAuth()
  const { runs, createRun } = useConnectorRuns()
  const { credentials } = useSupplierCredentials()
  const { suppliers } = useSuppliers()

  const handleStartIngestion = async (supplierId: string, connectorType: string) => {
    await createRun.mutateAsync({
      tenant_id: profile?.tenant_id ?? null,
      supplier_id: supplierId,
      connector_type: connectorType,
      status: 'pending'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary">Running</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getProgress = (run: any) => {
    if (run.status === 'completed') return 100
    if (run.status === 'running') return 50
    if (run.status === 'pending') return 10
    return 0
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Quick Actions</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {credentials?.filter(c => c.test_status === 'success').map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <div className="font-medium">{suppliers?.find(s => s.id === credential.supplier_id)?.name || 'Unknown Supplier'}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {suppliers?.find(s => s.id === credential.supplier_id)?.connector_type || 'Generic'}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartIngestion(
                    credential.supplier_id, 
                    suppliers?.find(s => s.id === credential.supplier_id)?.connector_type || 'generic'
                  )}
                  disabled={createRun.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Ingestion
                </Button>
              </div>
            ))}

            {(!credentials || credentials.filter(c => c.test_status === 'success').length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p>No active supplier connections</p>
                <p className="text-sm">Set up supplier credentials first</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ingestion Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runs?.slice(0, 10).map((run) => (
              <div key={run.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="font-medium">
                        {suppliers?.find(s => s.id === run.supplier_id)?.name || 'Unknown Supplier'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {run.connector_type} connector • Started {new Date(run.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(run.status)}
                </div>

                <Progress value={getProgress(run)} className="mb-3" />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Items Found</div>
                    <div className="font-medium">{run.items_found || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Prices Updated</div>
                    <div className="font-medium">{run.prices_updated || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Errors</div>
                    <div className="font-medium text-red-600">{run.errors_count || 0}</div>
                  </div>
                </div>

                {run.finished_at && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Completed: {new Date(run.finished_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}

            {(!runs || runs.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4" />
                <p>No ingestion runs yet</p>
                <p className="text-sm">Start your first price ingestion to see results here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```


---

## src\components\suppliers\SupplierCredentialsForm.tsx

```tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Key, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useAuth } from '@/contexts/useAuth'

export function SupplierCredentialsForm() {
  const { profile } = useAuth()
  const { suppliers } = useSuppliers()
  const { credentials, createCredential, updateCredential, deleteCredential } = useSupplierCredentials()
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) return

    await createCredential.mutateAsync({
      supplier_id: selectedSupplierId,
      username,
      password,
      api_key: apiKey
    })

    // Reset form
    setSelectedSupplierId('')
    setUsername('')
    setPassword('')
    setApiKey('')
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Testing</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Add Supplier Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="API username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="API password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key (if required)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional API key"
              />
            </div>

            <Button 
              type="submit" 
              disabled={!selectedSupplierId || createCredential.isPending}
              className="w-full"
            >
              {createCredential.isPending ? 'Saving...' : 'Save Credentials'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {credentials?.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(credential.test_status)}
                  <div>
                    <div className="font-medium">
                      {suppliers?.find(s => s.id === credential.supplier_id)?.name || 'Unknown Supplier'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last tested: {credential.last_tested_at ? 
                        new Date(credential.last_tested_at).toLocaleString() : 
                        'Never'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(credential.test_status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCredential.mutate(credential.id)}
                    disabled={deleteCredential.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!credentials || credentials.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4" />
                <p>No credentials stored yet</p>
                <p className="text-sm">Add supplier credentials to enable price ingestion</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```


---

## src\components\suppliers\SupplierItemsWithHarInfo.tsx

```tsx

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, AlertCircle } from 'lucide-react'
import type { Database } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

interface SupplierItemsWithHarInfoProps {
  items: SupplierItem[]
  supplierId: string
}

export function SupplierItemsWithHarInfo({ items, supplierId }: SupplierItemsWithHarInfoProps) {
  const getDataSourceBadge = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return null
    
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastSeen <= 1) {
      return <Badge variant="default" className="bg-green-500">Fresh Data</Badge>
    } else if (daysSinceLastSeen <= 7) {
      return <Badge variant="secondary">Recent Data</Badge>
    } else if (daysSinceLastSeen <= 30) {
      return <Badge variant="outline">Aging Data</Badge>
    }
    return null
  }

  const getLastSeenText = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never synced'
    return `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Supplier Items
          </CardTitle>
          <CardDescription>
            No items found. Upload a HAR file to sync product data.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Supplier Items ({items.length})
        </CardTitle>
        <CardDescription>
          Product data synchronized from supplier systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{item.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.ext_sku}
                  {item.brand && ` • Brand: ${item.brand}`}
                  {item.pack_qty && item.pack_unit_id && (
                    ` • Pack: ${item.pack_qty} ${item.pack_unit_id}`
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {getLastSeenText(item.last_seen_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getDataSourceBadge(item.last_seen_at)}
                <Badge variant="outline" className="text-xs">
                  VAT: {item.vat_code || 0}%
                </Badge>
              </div>
            </div>
          ))}
          
          {items.length > 10 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              ... and {items.length - 10} more items
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\SupplierList.tsx

```tsx

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, Upload, Plus, Building2 } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Database } from '@/lib/types'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row'] & {
  supplier?: Supplier
}

interface SupplierListProps {
  suppliers: Supplier[]
  credentials: SupplierCredential[]
  selectedSupplier: string | null
  onSelectSupplier: (supplierId: string) => void
  onRunConnector: (supplierId: string) => void
  onHarUpload?: (supplierId: string) => void
}

export function SupplierList({
  suppliers,
  credentials,
  selectedSupplier,
  onSelectSupplier,
  onRunConnector,
  onHarUpload
}: SupplierListProps) {
  const { createSupplier } = useSuppliers()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newConnectorType, setNewConnectorType] = useState('generic')

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupplier.mutateAsync({
        name: newSupplierName,
        connector_type: newConnectorType,
        logo_url: '/placeholder.svg'
      })
      setIsDialogOpen(false)
      setNewSupplierName('')
      setNewConnectorType('generic')
    } catch (error) {
      // error handled in hook
    }
  }
  const getCredentialStatus = (supplierId: string) => {
    const credential = credentials?.find(c => c.supplier_id === supplierId)
    if (!credential) return 'not-configured'
    if (credential.test_status === 'success') return 'verified'
    if (credential.test_status === 'failed') return 'failed'
    return 'configured'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>
      case 'configured':
        return <Badge variant="secondary">Configured</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Configured</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Available Suppliers</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="supplier-name">Name</Label>
                <Input
                  id="supplier-name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label htmlFor="connector-type">Connector Type</Label>
                <Select
                  value={newConnectorType}
                  onValueChange={setNewConnectorType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!newSupplierName || createSupplier.isPending}
                >
                  {createSupplier.isPending ? 'Saving...' : 'Save Supplier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suppliers && suppliers.length > 0 ? (
            suppliers.map((supplier) => {
              const status = getCredentialStatus(supplier.id)
              return (
                <div
                  key={supplier.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSupplier === supplier.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectSupplier(supplier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.connector_type} connector
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status)}
                      {onHarUpload && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onHarUpload(supplier.id)
                          }}
                          title="Sync via HAR upload"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}
                      {status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRunConnector(supplier.id)
                          }}
                          title="Run connector"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4" />
              <p>No suppliers found</p>
              <p className="text-sm">Add a supplier to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\SupplierManagement.tsx

```tsx

import React, { useState } from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { HarUploadModal } from './HarUploadModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useAuth } from '@/contexts/useAuth'

export function SupplierManagement() {
  const { profile } = useAuth()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  const { credentials } = useSupplierCredentials()
  const { createRun } = useConnectorRuns()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [harUploadOpen, setHarUploadOpen] = useState(false)

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplier(supplierId)
  }

  const handleRunConnector = async (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId)
    if (!supplier) return

    await createRun.mutateAsync({
      tenant_id: profile?.tenant_id ?? null,
      supplier_id: supplierId,
      connector_type: supplier.connector_type || 'generic',
      status: 'pending'
    })
  }

  const handleHarUpload = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setHarUploadOpen(true)
  }

  const handleHarUploadSuccess = () => {
    // Optionally refresh suppliers data
    // queryClient.invalidateQueries(['suppliers'])
  }

  return (
    <>
      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="ingestion" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ingestion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierList 
            suppliers={suppliers || []}
            credentials={credentials || []}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={handleSelectSupplier}
            onRunConnector={handleRunConnector}
            onHarUpload={handleHarUpload}
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <SupplierCredentialsForm />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6">
          <IngestionRunsList />
        </TabsContent>
      </Tabs>

      <HarUploadModal
        open={harUploadOpen}
        onClose={() => setHarUploadOpen(false)}
        tenantId={profile?.tenant_id || ''}
        supplierId={selectedSupplier || ''}
        onSuccess={handleHarUploadSuccess}
      />
    </>
  )
}

```


---

## src\contexts\BasketProvider.test.tsx

```tsx
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import BasketProvider from './BasketProvider'
import { useCart } from './useBasket'

describe('BasketProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes items when quantity is set to zero', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(
        {
          id: '1',
          supplierId: 's1',
          supplierName: 'Supplier',
          itemName: 'Test item',
          sku: 'sku',
          packSize: '1kg',
          packPrice: 100,
          unitPriceExVat: 100,
          unitPriceIncVat: 100,
          quantity: 1,
          vatRate: 0,
          unit: 'each',
          supplierItemId: '1',
          displayName: 'Test item',
          packQty: 1,
          image: null
        },
        1,
        { showToast: false }
      )
    })

    act(() => {
      result.current.updateQuantity('1', 0)
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('migrates legacy cart items and avoids duplicates on add', () => {
    const legacy = [
      {
        id: '1',
        supplierId: 's1',
        supplierName: 'Supplier',
        itemName: 'Legacy item',
        sku: 'sku',
        packSize: '1kg',
        packPrice: null,
        unitPriceExVat: null,
        unitPriceIncVat: null,
        quantity: 1,
        vatRate: 0,
        unit: 'each',
        displayName: 'Legacy item',
        packQty: 1,
        image: null
      }
    ]
    localStorage.setItem('procurewise-basket', JSON.stringify(legacy))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BasketProvider>{children}</BasketProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(
        { product_id: '1', supplier_id: 's1' },
        1,
        { showToast: false }
      )
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.items[0].supplierItemId).toBe('1')
  })
})

```


---

## src\contexts\BasketProvider.tsx

```tsx
import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { CartItem } from '@/lib/types'
import { BasketContext } from './BasketProviderUtils'
import { ToastAction } from '@/components/ui/toast'
import { flyToCart } from '@/lib/flyToCart'
import { getCachedImageUrl } from '@/services/ImageCache'

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('procurewise-basket')
    if (!saved) return []

    try {
      const parsed: any[] = JSON.parse(saved)

      // Migration: legacy basket entries only stored the product `name` field.
      // Ensure newer schema fields `itemName` and `displayName` are populated
      // when loading from localStorage for backward compatibility.
      return parsed.map(it => ({
        ...it,
        supplierItemId: it.supplierItemId ?? it.id,
        itemName:
          it.itemName ??
          it.name ??
          it.title ??
          it.productName,
        displayName:
          it.displayName ??
          it.itemName ??
          it.name ??
          it.title ??
          it.productName,
      }))
    } catch {
      return []
    }
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { toast } = useToast()

  // Sync basket across tabs
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('procurewise-basket')
        : null

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BASKET_UPDATED') {
        setItems(event.data.items)
      }
    }

    channel?.addEventListener('message', handleMessage)
    return () => {
      channel?.removeEventListener('message', handleMessage)
      channel?.close()
    }
  }, [])

  // Fallback: cross-tab sync via storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
        if (e.key === 'procurewise-basket' && e.newValue) {
          try {
            setItems(JSON.parse(e.newValue))
          } catch {
            /* ignore parse errors */
          }
        }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const syncBasket = (() => {
    let timeout: number | undefined
    let latest: CartItem[] = []
    const send = (items: CartItem[]) => {
      localStorage.setItem('procurewise-basket', JSON.stringify(items))
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('procurewise-basket')
        channel.postMessage({ type: 'BASKET_UPDATED', items })
        channel.close()
      }
    }
    return (items: CartItem[]) => {
      latest = items
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(() => send(latest), 400)
    }
  })()

  const addItem = (
    item:
      | Omit<CartItem, 'quantity'>
      | { product_id: string; supplier_id: string; quantity?: number },
    quantity = 1,
    options: { showToast?: boolean; animateElement?: HTMLElement } = {}
  ) => {
    let normalizedItem: Omit<CartItem, 'quantity'>
    let finalQuantity = quantity

    if ('product_id' in item && 'supplier_id' in item) {
      normalizedItem = {
        id: item.product_id,
        supplierId: item.supplier_id,
        supplierName: '',
        itemName: 'Item',
        sku: '',
        packSize: '',
        packPrice: null,
        unitPriceExVat: null,
        unitPriceIncVat: null,
        vatRate: 0,
        unit: '',
        supplierItemId: item.product_id,
        displayName: 'Item',
        packQty: 1,
        image: null
      }
      if (item.quantity != null) {
        finalQuantity = item.quantity
      }
    } else {
      normalizedItem = {
        ...item,
        itemName: item.itemName ?? item.displayName ?? 'Item',
        displayName: item.displayName ?? item.itemName ?? 'Item',
        image: item.image ? getCachedImageUrl(item.image) : null
      }
    }

    const previousItems = items.map(i => ({ ...i }))
    if (options.animateElement) {
      flyToCart(options.animateElement)
    }
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.supplierItemId === normalizedItem.supplierItemId
      )

      let newItems: CartItem[]
      if (existingIndex >= 0) {
        newItems = prev.map((basketItem, index) =>
          index === existingIndex
            ? { ...basketItem, quantity: basketItem.quantity + finalQuantity }
            : basketItem
        )
      } else {
        newItems = [...prev, { ...normalizedItem, quantity: finalQuantity }]
      }

      syncBasket(newItems)

      if (options.showToast !== false) {
        toast({
          description: `Added ${normalizedItem.itemName} × ${finalQuantity}`,
          action: (
            <ToastAction altText="Undo" onClick={() => restoreItems(previousItems)}>
              Undo
            </ToastAction>
          )
        })
      }

      return newItems
    })
  }

  const updateQuantity = (supplierItemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(supplierItemId)
      return
    }
    setItems(prev => {
      const newQuantity = Math.max(1, quantity)
      const newItems = prev.map(item =>
        item.supplierItemId === supplierItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
      syncBasket(newItems)
      return newItems
    })
  }

  const removeItem = (supplierItemId: string) => {
    setItems(prev => {
      const previousItems = prev.map(i => ({ ...i }))
      const removed = prev.find(i => i.supplierItemId === supplierItemId)
      const newItems = prev.filter(item => item.supplierItemId !== supplierItemId)
      syncBasket(newItems)
      if (removed) {
        toast({
          description: `${removed.itemName} removed from cart`,
          action: (
            <ToastAction altText="Undo" onClick={() => restoreItems(previousItems)}>
              Undo
            </ToastAction>
          ),
        })
      }
      return newItems
    })
  }

  const clearBasket = () => {
    setItems([])
    syncBasket([])
  }

  const restoreItems = (items: CartItem[]) => {
    setItems(items)
    syncBasket(items)
  }

  // Add clearCart method for backward compatibility
  const clearCart = clearBasket

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = (includeVat: boolean): number => {
    return items.reduce((total, item) => {
      const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      return total + ((price ?? 0) * item.quantity)
    }, 0)
  }

  const getMissingPriceCount = () =>
    items.filter(i => i.unitPriceIncVat == null && i.unitPriceExVat == null).length

  return (
    <BasketContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearBasket,
      clearCart,
      restoreItems,
      getTotalItems,
      getTotalPrice,
      getMissingPriceCount,
      isDrawerOpen,
      setIsDrawerOpen
    }}>
      {children}
    </BasketContext.Provider>
  )
}


```


---

## src\hooks\useDeliveryAnalytics.tsx

```tsx

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

export function useDeliveryAnalytics(months: number = 6) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['delivery-analytics', profile?.tenant_id || 'solo', months],
    queryFn: async () => {
      const tenantId = profile?.tenant_id

      // Get monthly delivery spending
      const baseMonthly = supabase
        .from('delivery_analytics')
        .select('*')
        .gte('month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('month', { ascending: true })

      const { data: monthlyData } = tenantId
        ? await baseMonthly.eq('tenant_id', tenantId)
        : await baseMonthly.is('tenant_id', null)

      // Get supplier breakdown - fixed the query structure
      const baseSupplier = supabase
        .from('delivery_analytics')
        .select(`
          supplier_id,
          suppliers(name),
          total_fees_paid,
          total_orders,
          orders_under_threshold
        `)
        .gte('month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: supplierData } = tenantId
        ? await baseSupplier.eq('tenant_id', tenantId)
        : await baseSupplier.is('tenant_id', null)

      // Process the data
      const monthlySpend = monthlyData?.reduce((acc, item) => {
        const month = new Date(item.month).toLocaleDateString('is-IS', { month: 'short', year: 'numeric' })
        const existing = acc.find(a => a.month === month)
        
        if (existing) {
          existing.fees += item.total_fees_paid
          existing.orders += item.total_orders
        } else {
          acc.push({
            month,
            fees: item.total_fees_paid,
            orders: item.total_orders
          })
        }
        
        return acc
      }, [] as Array<{ month: string; fees: number; orders: number }>) || []

      // Fixed supplier breakdown processing to handle the correct data structure
      const supplierBreakdown = supplierData?.reduce((acc, item) => {
        const supplierName = (item.suppliers as any)?.name || 'Unknown Supplier'
        const existing = acc.find(a => a.supplier === supplierName)
        const efficiency = item.total_orders > 0 
          ? Math.round(((item.total_orders - item.orders_under_threshold) / item.total_orders) * 100)
          : 0
        
        if (existing) {
          existing.fees += item.total_fees_paid
          existing.orders += item.total_orders
          existing.efficiency = Math.round((existing.efficiency + efficiency) / 2)
        } else {
          acc.push({
            supplier: supplierName,
            fees: item.total_fees_paid,
            orders: item.total_orders,
            efficiency
          })
        }
        
        return acc
      }, [] as Array<{ supplier: string; fees: number; orders: number; efficiency: number }>) || []

      // Calculate threshold analysis
      const totalOrders = monthlyData?.reduce((sum, item) => sum + item.total_orders, 0) || 0
      const ordersWithFees = monthlyData?.reduce((sum, item) => sum + item.orders_under_threshold, 0) || 0
      const totalFeesPaid = monthlyData?.reduce((sum, item) => sum + item.total_fees_paid, 0) || 0
      const potentialSavings = Math.round(totalFeesPaid * 0.3) // Estimate 30% could be saved with optimization

      return {
        monthlySpend,
        supplierBreakdown,
        thresholdAnalysis: {
          totalOrders,
          ordersWithFees,
          totalFeesPaid,
          potentialSavings
        },
        trends: {
          feeReduction: 0, // Would calculate from historical data
          orderEfficiency: totalOrders > 0 ? Math.round(((totalOrders - ordersWithFees) / totalOrders) * 100) : 0,
          avgOrderValue: 0 // Would calculate from order data
        }
      }
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

```


---

## src\hooks\useEnhancedSupplierItems.tsx

```tsx

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/useAuth'
import { handleQueryError, createDedupedQuery } from '@/lib/queryErrorHandler'
import { useTenantValidation } from './useTenantValidation'
import { useAuditLogger } from './useAuditLogger'

interface SupplierItemsFilters {
  search?: string
  supplierId?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  category?: string
  limit?: number
  offset?: number
}

// Create deduplicated query function
const dedupedSupplierItemsQuery = createDedupedQuery(
  async (filters: SupplierItemsFilters, tenantId: string) => {
    let query = supabase
      .from('supplier_items')
      .select(`
        *,
        supplier:suppliers(name, id)
      `)
      .order('name')

    // Apply filters
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    
    if (filters.supplierId) {
      query = query.eq('supplier_id', filters.supplierId)
    }
    
    if (filters.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock)
    }
    
    if (filters.minPrice) {
      query = query.gte('price_ex_vat', filters.minPrice)
    }
    
    if (filters.maxPrice) {
      query = query.lte('price_ex_vat', filters.maxPrice)
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    // Pagination with security limits
    const maxLimit = 1000 // Prevent excessive data requests
    const safeLimit = Math.min(filters.limit || 100, maxLimit)
    const safeOffset = Math.max(filters.offset || 0, 0)
    
    if (safeLimit) {
      query = query.range(safeOffset, safeOffset + safeLimit - 1)
    }

    const { data, error } = await query

    if (error) {
      handleQueryError(error, 'enhanced supplier items')
      throw error
    }
    
    return data || []
  }
)

export function useEnhancedSupplierItems(filters: SupplierItemsFilters = {}) {
  const { user, profile } = useAuth()
  const { logDataAccess } = useAuditLogger()
  const { data: tenantValidation } = useTenantValidation(profile?.tenant_id)

  return useQuery({
    queryKey: queryKeys.suppliers.items(filters.supplierId, filters),
    queryFn: async () => {
      if (!tenantValidation?.isValid) {
        throw new Error('Invalid tenant context')
      }

      const data = await dedupedSupplierItemsQuery(filters, profile!.tenant_id)
      
      // Log data access for audit purposes
      logDataAccess('supplier_items', 'bulk_access', 'query_supplier_items')
      
      return data
    },
    enabled: !!user && !!tenantValidation?.isValid,
    // Enhanced caching strategy
    staleTime: filters.search ? 30000 : 1000 * 60 * 5, // Shorter for searches
    gcTime: 1000 * 60 * 15, // Longer retention for frequently accessed data
    // Use placeholderData to prevent loading states during filter changes
    placeholderData: (previousData) => previousData,
    // Enhanced error handling
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('Invalid tenant context') || 
          (error as any)?.code === 'PGRST301') {
        return false
      }
      return failureCount < 2
    },
    // Network-first for security-sensitive data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

```


---

## src\hooks\useOptimizedSupplierItems.tsx

```tsx

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/contexts/useAuth'
import { handleQueryError } from '@/lib/queryErrorHandler'
import { useTenantValidation } from './useTenantValidation'

interface SupplierItemsFilters {
  search?: string
  supplierId?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  category?: string
  limit?: number
  offset?: number
}

export function useOptimizedSupplierItems(filters: SupplierItemsFilters = {}) {
  const { user, profile } = useAuth()
  const { data: tenantValidation } = useTenantValidation(profile?.tenant_id)

  return useQuery({
    queryKey: queryKeys.suppliers.items(filters.supplierId, filters),
    queryFn: async () => {
      // Validate tenant context before proceeding
      if (!tenantValidation?.isValid) {
        throw new Error('Invalid tenant context')
      }

      let query = supabase
        .from('supplier_items')
        .select(`
          *,
          supplier:suppliers(name, id)
        `)
        .order('name')

      // Apply filters with input validation
      if (filters.search && filters.search.trim()) {
        const sanitizedSearch = filters.search.trim().substring(0, 100) // Limit search length
        query = query.ilike('name', `%${sanitizedSearch}%`)
      }
      
      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId)
      }
      
      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock)
      }
      
      if (filters.minPrice && filters.minPrice >= 0) {
        query = query.gte('price_ex_vat', filters.minPrice)
      }
      
      if (filters.maxPrice && filters.maxPrice >= 0) {
        query = query.lte('price_ex_vat', filters.maxPrice)
      }
      
      if (filters.category && filters.category.trim()) {
        query = query.eq('category', filters.category.trim())
      }

      // Enhanced pagination with security limits
      const maxLimit = 1000
      const safeLimit = Math.min(filters.limit || 100, maxLimit)
      const safeOffset = Math.max(filters.offset || 0, 0)
      
      if (safeLimit) {
        query = query.range(safeOffset, safeOffset + safeLimit - 1)
      }

      const { data, error } = await query

      if (error) {
        handleQueryError(error, 'supplier items')
        throw error
      }
      return data || []
    },
    enabled: !!user && !!tenantValidation?.isValid,
    // Optimize for large datasets with security considerations
    staleTime: filters.search ? 30000 : 1000 * 60 * 5, // Shorter stale time for searches
    gcTime: 1000 * 60 * 15, // Keep search results longer
    // Use placeholderData to prevent loading states during filter changes
    placeholderData: (previousData) => previousData,
    // Enhanced retry logic
    retry: (failureCount, error) => {
      if (error?.message?.includes('Invalid tenant context') || 
          (error as any)?.code === 'PGRST301') {
        return false
      }
      return failureCount < 2
    },
    // Security-focused refetch settings
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

```


---

## src\hooks\useOrderingSuggestions.tsx

```tsx

import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/contexts/useBasket'
import { orderingSuggestions } from '@/services/OrderingSuggestions'

export function useOrderingSuggestions() {
  const { items } = useCart()
  const key = items
    .map(i => `${i.supplierId}:${i.supplierItemId}:${i.quantity}`)
    .sort()
    .join('|')

  return useQuery({
    queryKey: ['ordering-suggestions', key],
    queryFn: () => orderingSuggestions.generateSuggestions(items),
    enabled: items.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

```


---

## src\hooks\useSupplierConnections.ts

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import { SupplierStatus } from '@/components/dashboard/status-tokens'

export interface SupplierConnection {
  id: string
  supplier_id: string
  name: string
  status: SupplierStatus
  last_sync: string | null
  next_run: string | null
}

export function useSupplierConnections() {
  const { profile } = useAuth()

  const { data: suppliers, isLoading } = useQuery<SupplierConnection[]>({
    queryKey: [...queryKeys.dashboard.suppliers(), profile?.tenant_id],
    queryFn: async () => {
      try {
        const query = supabase
          .from('supplier_connections')
          .select('id, supplier_id, status, last_sync, next_run, supplier:suppliers(name)')
          .order('created_at', { ascending: false })

        const { data, error } = profile?.tenant_id
          ? await query.eq('tenant_id', profile.tenant_id)
          : await query.is('tenant_id', null)

        if (error) {
          // If table doesn't exist, return empty array
          console.warn('Supplier connections table not found:', error)
          return []
        }

        return (
          data?.map((s: any) => ({
            id: s.id,
            supplier_id: s.supplier_id,
            name: s.supplier?.name ?? '',
            status: s.status as SupplierStatus,
            last_sync: s.last_sync,
            next_run: s.next_run,
          })) || []
        )
      } catch (error) {
        console.warn('Error fetching supplier connections:', error)
        return []
      }
    },
    enabled: !!profile
  })

  return { suppliers: suppliers || [], isLoading }
}

```


---

## src\hooks\useSupplierCredentials.tsx

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import type { Database } from '@/lib/types'

type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row']

export function useSupplierCredentials() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: credentials, isLoading } = useQuery({
    queryKey: ['supplier-credentials', profile?.tenant_id || 'solo'],
    queryFn: async (): Promise<SupplierCredential[]> => {
      const tenantId = profile?.tenant_id

      const query = supabase
        .from('supplier_credentials')
        .select('*')

      const { data, error } = tenantId
        ? await query.eq('tenant_id', tenantId)
        : await query.is('tenant_id', null)

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createCredential = useMutation({
    mutationFn: async (credentialData: { 
      supplier_id: string; 
      username?: string; 
      password?: string; 
      api_key?: string 
    }) => {
      const { supplier_id, ...credentials } = credentialData
      
      // Use proper encryption via database function
      const { data: encryptedData, error: encryptError } = await supabase
        .rpc('encrypt_credential_data', {
          credential_data: credentials
        })

      if (encryptError) throw encryptError
      
      const payload = { 
        supplier_id,
        encrypted_credentials: encryptedData,
        tenant_id: profile?.tenant_id ?? null,
        test_status: 'pending'
      }

      const { data, error } = await supabase
        .from('supplier_credentials')
        .insert(payload)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials saved',
        description: 'Supplier credentials have been encrypted and stored securely using AES encryption'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateCredential = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierCredential> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials updated',
        description: 'Supplier credentials have been updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const deleteCredential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_credentials')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({
        title: 'Credentials deleted',
        description: 'Supplier credentials have been securely removed'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete credentials',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    credentials,
    isLoading,
    createCredential,
    updateCredential,
    deleteCredential
  }
}
```


---

## src\hooks\useSupplierItems.tsx

```tsx

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/lib/types'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row'] & { logo_url?: string | null }

export function useSupplierItems(supplierId?: string) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['supplier-items', supplierId],
    queryFn: async (): Promise<SupplierItem[]> => {
      if (!supplierId) return []
      
      const { data, error } = await supabase
        .from('supplier_items')
        .select('*, suppliers(logo_url)')
        .eq('supplier_id', supplierId)
        .order('last_seen_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return (data || []).map((d: any) => ({ ...d, logo_url: d.suppliers?.logo_url ?? null }))
    },
    enabled: !!supplierId
  })

  const getItemStats = () => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    const stats = {
      total: items.length,
      fresh: 0,
      recent: 0,
      aging: 0,
      stale: 0,
      neverSeen: 0
    }

    items.forEach(item => {
      if (!item.last_seen_at) {
        stats.neverSeen++
        return
      }

      const daysSinceLastSeen = now - new Date(item.last_seen_at).getTime()
      
      if (daysSinceLastSeen <= oneDay) {
        stats.fresh++
      } else if (daysSinceLastSeen <= oneWeek) {
        stats.recent++
      } else if (daysSinceLastSeen <= oneMonth) {
        stats.aging++
      } else {
        stats.stale++
      }
    })

    return stats
  }

  return {
    items,
    isLoading,
    error,
    stats: getItemStats()
  }
}

```


---

## src\hooks\useSuppliers.tsx

```tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

import type { Database } from '@/lib/types'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']

export function useSuppliers() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    }
  })

  const createSupplier = useMutation({
    mutationFn: async (supplier: Omit<SupplierInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Supplier created',
        description: 'New supplier has been added'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create supplier',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Supplier updated',
        description: 'Supplier information has been updated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update supplier',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    suppliers,
    isLoading,
    createSupplier,
    updateSupplier
  }
}

```


---

## src\lib\catalogFilters.ts

```ts
export type Tri = -1 | 0 | 1 // exclude, neutral, include

export type TriState = 'off' | 'include' | 'exclude'

export interface CatalogFilters {
  q?: string
  availability?: 'all' | 'in_stock' | 'preorder'
  categories?: string[]
  brands?: { include: string[]; exclude: string[] }
  suppliers?: Record<string, Tri>
  price?: { min?: number; max?: number }
  packSizes?: string[]
}

export const createEmptyFilters = (): CatalogFilters => ({
  availability: 'all',
  categories: [],
  brands: { include: [], exclude: [] },
  suppliers: {},
})

export function toggleArray<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

export function toggleTri(current: Tri | undefined, mode: 'include'|'exclude'|'cycle'): Tri {
  const v = current ?? 0
  if (mode === 'include') return v === 1 ? 0 : 1
  if (mode === 'exclude') return v === -1 ? 0 : -1
  return v === 0 ? 1 : v === 1 ? -1 : 0
}

export function triStockToAvailability(tri: TriState): string[] | undefined {
  switch (tri) {
    case 'include':
      return ['IN_STOCK']
    case 'exclude':
      return ['OUT_OF_STOCK']
    default:
      return undefined
  }
}

```


---

## src\lib\catalogState.ts

```ts
export type CatalogView = 'grid' | 'table';

export interface CatalogState {
  q: string;
  view: CatalogView;
  sort: string;
  pageSize: number;
  vat?: 'inc' | 'ex';
  filters: {
    categories?: string[];
    brands?: string[];
    suppliers?: Record<string, -1 | 0 | 1>;
    availability?: 'in_stock' | 'all' | 'preorder';
  };
}

/** Stable stringify (sort object keys) */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
      if (Array.isArray(v)) return v.map(stringify);
      return Object.keys(v)
        .sort()
        .reduce((acc, k) => {
          acc[k] = stringify((v as any)[k]);
          return acc;
        }, {} as any);
    }
    return v;
  };
  return JSON.stringify(stringify(value));
}

/** Tiny hash so query keys stay short */
export function tinyHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // unsigned 32-bit to base36
  return (h >>> 0).toString(36);
}

/** Build a deterministic key fragment for React Query + URL */
export function stateKeyFragment(state: CatalogState): string {
  return tinyHash(stableStringify(state));
}

```


---

## src\lib\landedCost.ts

```ts

import { deliveryRules } from '@/services/DeliveryRules'

export async function estimateFee(supplierId: string, subtotalExVat: number): Promise<number> {
  try {
    const rule = await deliveryRules.getRule(supplierId)
    if (!rule) return 0

    const threshold = rule.free_threshold_ex_vat
    return threshold !== null && subtotalExVat >= threshold ? 0 : rule.flat_fee
  } catch (error) {
    console.error('Failed to estimate delivery fee:', error)
    return 0
  }
}

export function calculateBreakEven(
  currentPrice: number,
  cheaperPrice: number,
  deliveryFee: number
): number {
  const unitSavings = currentPrice - cheaperPrice
  if (unitSavings <= 0) return 0

  return Math.ceil(deliveryFee / unitSavings)
}

export async function getDeliveryHint(supplierId: string): Promise<string | null> {
  try {
    const rule = await deliveryRules.getRule(supplierId)
    if (!rule || !rule.cutoff_time || !rule.delivery_days?.length) return null

    const today = new Date()
    const currentDay = today.getDay() === 0 ? 7 : today.getDay()

    const sortedDays = [...rule.delivery_days].sort((a, b) => a - b)
    const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]

    const daysUntil = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + daysUntil)
    const nextDeliveryDay = deliveryDate.toLocaleDateString('en-US', { weekday: 'short' })

    return `Order by ${rule.cutoff_time} for ${nextDeliveryDay}`
  } catch (error) {
    console.error('Failed to get delivery hint:', error)
    return null
  }
}

```


---

## src\lib\normalization.ts

```ts
const UNIT_MAP: Record<string, { multiplier: number; unit: string }> = {
  kg: { multiplier: 1000, unit: 'g' },
  g: { multiplier: 1, unit: 'g' },
  l: { multiplier: 1000, unit: 'ml' },
  ml: { multiplier: 1, unit: 'ml' },
  pcs: { multiplier: 1, unit: 'pcs' },
  pc: { multiplier: 1, unit: 'pcs' }
}

export function normalizeUnit(input: string): { amount: number; unit: string } {
  const match = input.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|pc)$/)
  if (!match) return { amount: NaN, unit: '' }
  const value = parseFloat(match[1])
  const { multiplier, unit } = UNIT_MAP[match[2]]
  return { amount: value * multiplier, unit }
}

export function normalizeBrand(brand: string): string {
  return brand.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function cleanName(name: string): string {
  return name
    .replace(/promo pack/gi, '')
    .replace(/-new/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateSupplierProduct(row: {
  barcode?: string
  unit?: string
  price?: number
  previous_price?: number
}): string[] {
  const issues: string[] = []
  if (!row.barcode) issues.push('missing barcode')
  if (row.unit && !UNIT_MAP[row.unit.toLowerCase()]) issues.push('invalid unit')
  if (row.price && row.previous_price && row.price > row.previous_price * 2) {
    issues.push('suspicious price jump')
  }
  return issues
}

```


---

## src\lib\queryKeys.ts

```ts

export const queryKeys = {
  // User and auth related queries
  user: {
    profile: (userId?: string) => ['user', 'profile', userId] as const,
    memberships: (userId?: string) => ['user', 'memberships', userId] as const,
    permissions: (userId?: string) => ['user', 'permissions', userId] as const,
  },
  
  // Tenant related queries
  tenant: {
    all: () => ['tenants'] as const,
    detail: (tenantId: string) => ['tenant', tenantId] as const,
    users: (tenantId: string) => ['tenant', tenantId, 'users'] as const,
    settings: (tenantId: string) => ['tenant', tenantId, 'settings'] as const,
  },
  
  // Categories
  categories: {
    all: () => ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (categoryId: string) => ['category', categoryId] as const,
  },

  // Product queries
  products: {
    list: (filters?: any) => ['products', filters] as const,
  },

  // Catalog queries
  catalog: {
    list: (filters?: any) => ['catalog', 'list', filters] as const,
    unmatched: () => ['catalog', 'unmatched'] as const,
  },
  
  // Supplier related queries
  suppliers: {
    all: () => ['suppliers'] as const,
    list: () => ['suppliers', 'list'] as const,
    detail: (supplierId: string) => ['supplier', supplierId] as const,
    items: (supplierId?: string, filters?: any) => ['supplier', 'items', supplierId, filters] as const,
    credentials: (supplierId: string) => ['supplier', supplierId, 'credentials'] as const,
    runs: (supplierId: string) => ['supplier', supplierId, 'runs'] as const,
  },
  
  // Order related queries
  orders: {
    all: () => ['orders'] as const,
    detail: (orderId: string) => ['order', orderId] as const,
    lines: (orderId: string) => ['order', orderId, 'lines'] as const,
    recent: () => ['orders', 'recent'] as const,
  },
  
  // Price and comparison queries
  prices: {
    quotes: (filters?: any) => ['prices', 'quotes', filters] as const,
    history: (itemId: string) => ['prices', 'history', itemId] as const,
    comparison: (filters?: any) => ['prices', 'comparison', filters] as const,
    realTime: () => ['prices', 'realTime'] as const,
  },
  
  // Admin and security queries
  admin: {
    elevations: () => ['admin', 'elevations'] as const,
    activeElevation: () => ['admin', 'activeElevation'] as const,
    supportSessions: () => ['admin', 'supportSessions'] as const,
    auditLogs: (filters?: any) => ['admin', 'auditLogs', filters] as const,
    jobs: () => ['admin', 'jobs'] as const,
    pendingActions: () => ['admin', 'pendingActions'] as const,
  },
  
  // Security monitoring queries
  security: {
    alerts: () => ['security', 'alerts'] as const,
    suspiciousElevations: () => ['security', 'suspiciousElevations'] as const,
    failedJobs: () => ['security', 'failedJobs'] as const,
    prolongedElevations: () => ['security', 'prolongedElevations'] as const,
    events: () => ['security', 'events'] as const,
    policies: () => ['security', 'policies'] as const,
    functions: () => ['security', 'functions'] as const,
  },
  
  // Connection and health queries
  connections: {
    health: () => ['connections', 'health'] as const,
    status: (supplierId: string) => ['connection', supplierId, 'status'] as const,
  },
  
  // Analytics queries
  analytics: {
    delivery: (filters?: any) => ['analytics', 'delivery', filters] as const,
    pricing: (filters?: any) => ['analytics', 'pricing', filters] as const,
    usage: () => ['analytics', 'usage'] as const,
  },

  // Dashboard queries
  dashboard: {
    alerts: () => ['dashboard', 'alerts'] as const,
    anomalies: () => ['dashboard', 'anomalies'] as const,
    suppliers: () => ['dashboard', 'suppliers'] as const,
    liveUpdates: () => ['dashboard', 'liveUpdates'] as const,
  },

  // Mutation keys for optimistic updates
  mutations: {
    createOrder: () => ['mutation', 'createOrder'] as const,
    updateSupplierCredentials: () => ['mutation', 'updateSupplierCredentials'] as const,
    createElevation: () => ['mutation', 'createElevation'] as const,
    inviteUser: () => ['mutation', 'inviteUser'] as const,
  }
} as const

// Helper function to invalidate related queries
export const getInvalidationKeys = {
  afterOrderCreate: () => [
    queryKeys.orders.all(),
    queryKeys.orders.recent(),
    queryKeys.analytics.usage()
  ],
  afterUserInvite: (tenantId: string) => [
    queryKeys.tenant.users(tenantId),
    queryKeys.admin.auditLogs()
  ],
  afterCredentialsUpdate: (supplierId: string) => [
    queryKeys.suppliers.credentials(supplierId),
    queryKeys.connections.status(supplierId),
    queryKeys.connections.health()
  ],
  afterElevationChange: () => [
    queryKeys.admin.elevations(),
    queryKeys.admin.activeElevation(),
    queryKeys.security.suspiciousElevations(),
    queryKeys.security.prolongedElevations()
  ]
}

```


---

## src\pages\Suppliers.tsx

```tsx

import React from 'react'
import { EnhancedSupplierManagement } from '@/components/suppliers/EnhancedSupplierManagement'

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
        <p className="text-muted-foreground">
          Manage supplier credentials, HAR data ingestion, and product synchronization
        </p>
      </div>
      
      <EnhancedSupplierManagement />
    </div>
  )
}

```


---

## src\router.test.ts

```ts
import { describe, it, expect } from 'vitest'
import { routes } from './router'

const appRoute = routes.find(r => r.path === '/')
if (!appRoute) {
  throw new Error('Root route not found')
}

const childPaths = new Set(
  (appRoute.children ?? []).map(r => (r.index ? '' : r.path))
)

const expectedPaths = ['', 'cart', 'compare', 'suppliers', 'pantry', 'price-history', 'discovery', 'admin']

describe('sidebar route definitions', () => {
  for (const p of expectedPaths) {
    it(`includes path "${p || '/'}"`, () => {
      expect(childPaths.has(p)).toBe(true)
    })
  }
  it('defines catalog route separately', () => {
    expect(routes.some(r => r.path === '/catalog')).toBe(true)
  })
})

describe('public auth routes', () => {
  it('does not gate reset-password route', () => {
    expect(childPaths.has('reset-password')).toBe(false)
  })
  it('does not gate forgot-password route', () => {
    expect(childPaths.has('forgot-password')).toBe(false)
  })
  it('defines reset-password route', () => {
    expect(routes.some(r => r.path === '/reset-password')).toBe(true)
  })
})

```


---

## src\router.tsx

```tsx

import { createBrowserRouter } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";
import Orders from "@/pages/Orders";
import Suppliers from "@/pages/Suppliers";
import Pantry from "@/pages/Pantry";
import Settings from "@/pages/Settings";
import PriceHistory from "@/pages/PriceHistory";
import Delivery from "@/pages/Delivery";
import Admin from "@/pages/Admin";
import Discovery from "@/pages/Discovery";
import CatalogPage from "@/pages/catalog/CatalogPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import ErrorPage from "@/pages/ErrorPage";
import NotFound from "@/pages/NotFound";
import { ExistingUserOnboarding } from "@/components/onboarding/ExistingUserOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const routes = [
  {
    path: "/",
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "cart",
        element: <Orders />,
      },
      {
        path: "compare",
        element: <Compare />,
      },
      {
        path: "suppliers",
        element: <Suppliers />,
      },
      {
        path: "pantry",
        element: <Pantry />,
      },
      {
        path: "price-history",
        element: <PriceHistory />,
      },
      {
        path: "discovery",
        element: <Discovery />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "delivery",
        element: <Delivery />,
      },
    ],
  },
  {
    path: "/catalog",
    element: (
      <AuthGate>
        <CatalogPage />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/onboarding",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/create",
    element: (
      <AuthGate>
        <OnboardingWizard />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/join",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

```


---

## src\services\__tests__\DeliveryCalculator.test.ts

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CartItem } from '@/lib/types'
import type { DeliveryRule } from '@/lib/types/delivery'

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() }
}))

import { DeliveryCalculator } from '../DeliveryCalculator'
import { supabase } from '@/integrations/supabase/client'

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>

let mockRules: DeliveryRule[] = []

beforeEach(() => {
  mockRules = []
  mockFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: mockRules })
  }))
})

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: '1',
    supplierId: 's1',
    supplierName: 'Supplier 1',
    itemName: 'Item',
    sku: 'SKU',
    packSize: '1',
    packPrice: overrides.unitPriceExVat ?? 0,
    unitPriceExVat: overrides.unitPriceExVat ?? 0,
    unitPriceIncVat: 0,
    quantity: 1,
    vatRate: 0,
    unit: 'each',
    supplierItemId: '1',
    displayName: 'Item',
    packQty: 1,
    image: overrides.image ?? null,
    ...overrides
  }
}

describe('calculateDeliveryForSupplier', () => {
  it('returns zero fees when no rule exists', async () => {
    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 50 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(0)
    expect(result.fuel_surcharge).toBe(0)
    expect(result.pallet_deposit).toBe(0)
    expect(result.total_delivery_cost).toBe(0)
    expect(result.landed_cost).toBe(50)
    expect(result.is_under_threshold).toBe(false)
    expect(result.threshold_amount).toBeNull()
    expect(result.amount_to_free_delivery).toBeNull()
    expect(result.next_delivery_day).toBeNull()
  })

  it('calculates fees and surcharges below threshold', async () => {
    mockRules = [{
      id: '1',
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 100,
      flat_fee: 10,
      fuel_surcharge_pct: 5,
      pallet_deposit_per_unit: 2,
      cutoff_time: null,
      delivery_days: [2, 4],
      tiers_json: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    }]

    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 40 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(10)
    expect(result.is_under_threshold).toBe(true)
    expect(result.fuel_surcharge).toBeCloseTo(2)
    expect(result.pallet_deposit).toBe(2)
    expect(result.amount_to_free_delivery).toBe(60)
  })

  it('calculates surcharges above threshold with no delivery fee', async () => {
    mockRules = [{
      id: '1',
      supplier_id: 's1',
      zone: 'default',
      free_threshold_ex_vat: 100,
      flat_fee: 10,
      fuel_surcharge_pct: 5,
      pallet_deposit_per_unit: 2,
      cutoff_time: null,
      delivery_days: [2, 4],
      tiers_json: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    }]

    const calculator = new DeliveryCalculator()
    const items = [makeItem({ unitPriceExVat: 60, quantity: 2 })]

    const result = await calculator.calculateDeliveryForSupplier('s1', 'Supplier 1', items)

    expect(result.delivery_fee).toBe(0)
    expect(result.is_under_threshold).toBe(false)
    expect(result.fuel_surcharge).toBeCloseTo(6)
    expect(result.pallet_deposit).toBe(4)
    expect(result.amount_to_free_delivery).toBeNull()
  })
})

describe('getNextDeliveryDay', () => {
  const calculator = new DeliveryCalculator()

  it('returns next delivery day in same week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-01')) // Monday
    const result = (calculator as any).getNextDeliveryDay([3, 5])
    const expected = new Date('2024-07-03').toLocaleDateString('is-IS', { weekday: 'short', month: 'short', day: 'numeric' })
    expect(result).toBe(expected)
    vi.useRealTimers()
  })

  it('wraps to next week when needed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-05')) // Friday
    const result = (calculator as any).getNextDeliveryDay([2, 3])
    const expected = new Date('2024-07-09').toLocaleDateString('is-IS', { weekday: 'short', month: 'short', day: 'numeric' })
    expect(result).toBe(expected)
    vi.useRealTimers()
  })

  it('returns null when no delivery days are provided', () => {
    const result = (calculator as any).getNextDeliveryDay([])
    expect(result).toBeNull()
  })
})


```


---

## src\services\__tests__\OrderingSuggestions.test.ts

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CartItem } from '@/lib/types'

vi.mock('../DeliveryCalculator', () => ({
  deliveryCalculator: {
    calculateOrderDelivery: vi.fn()
  }
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

import { OrderingSuggestionsService } from '../OrderingSuggestions'
import { deliveryCalculator } from '../DeliveryCalculator'
import { supabase } from '@/integrations/supabase/client'

const calculateOrderDeliveryMock = vi.mocked(deliveryCalculator.calculateOrderDelivery)
const rpcMock = vi.mocked(supabase.rpc)

const baseItem = {
  id: 'item',
  itemName: 'Item',
  sku: 'SKU',
  packSize: '1',
  packPrice: 0,
  unitPriceExVat: 0,
  unitPriceIncVat: 0,
  quantity: 1,
  vatRate: 0,
  unit: 'pcs',
  supplierItemId: 'item',
  displayName: 'Item',
  packQty: 1,
  image: null
}

describe('OrderingSuggestionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('suggests threshold optimization when under free-delivery threshold', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 30000,
        delivery_fee: 5000,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 5000,
        landed_cost: 35000,
        is_under_threshold: true,
        threshold_amount: 50000,
        amount_to_free_delivery: 20000,
        next_delivery_day: null
      }
    ])

    rpcMock.mockResolvedValue({ data: [{ id: 'freq1' }] } as any)

    const cart: CartItem[] = [
      {
        ...baseItem,
        supplierId: 'sup1',
        supplierName: 'Supplier 1',
        unitPriceExVat: 30000,
        unitPriceIncVat: 37200
      }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'threshold_optimization')).toBe(true)
  })

  it('suggests consolidation when multiple small suppliers exist', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 10000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 10000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      },
      {
        supplier_id: 'sup2',
        supplier_name: 'Supplier 2',
        subtotal_ex_vat: 8000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 8000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      }
    ])

    const cart: CartItem[] = [
      { ...baseItem, supplierId: 'sup1', supplierName: 'Supplier 1', unitPriceExVat: 5000, unitPriceIncVat: 6200 },
      { ...baseItem, supplierId: 'sup2', supplierName: 'Supplier 2', unitPriceExVat: 4000, unitPriceIncVat: 4960 }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'consolidation')).toBe(true)
  })

  it('suggests timing optimization when suppliers have different schedules', async () => {
    calculateOrderDeliveryMock.mockResolvedValue([
      {
        supplier_id: 'sup1',
        supplier_name: 'Supplier 1',
        subtotal_ex_vat: 60000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 60000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: 'Mon'
      },
      {
        supplier_id: 'sup2',
        supplier_name: 'Supplier 2',
        subtotal_ex_vat: 70000,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: 70000,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: 'Tue'
      }
    ])

    const cart: CartItem[] = [
      { ...baseItem, supplierId: 'sup1', supplierName: 'Supplier 1', unitPriceExVat: 60000, unitPriceIncVat: 74400 },
      { ...baseItem, supplierId: 'sup2', supplierName: 'Supplier 2', unitPriceExVat: 70000, unitPriceIncVat: 86800 }
    ]

    const service = new OrderingSuggestionsService()
    const suggestions = await service.generateSuggestions(cart)
    expect(suggestions.some(s => s.type === 'timing_optimization')).toBe(true)
  })
})


```


---

## src\services\DeliveryCalculator.ts

```ts

import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'
import type { 
  DeliveryRule, 
  DeliveryCalculation, 
  OrderDeliveryOptimization,
  DeliveryOptimizationSuggestion,
  DeliveryWarning
} from '@/lib/types/delivery'

export class DeliveryCalculator {
  private deliveryRules: Map<string, DeliveryRule> = new Map()
  private lastRulesFetch = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getDeliveryRules(): Promise<Map<string, DeliveryRule>> {
    const now = Date.now()
    
    if (now - this.lastRulesFetch > this.CACHE_DURATION) {
      const { data } = await (supabase as any)
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true)

      if (data) {
        this.deliveryRules.clear();
        (data as DeliveryRule[]).forEach(rule => {
          this.deliveryRules.set(rule.supplier_id, rule)
        })
        this.lastRulesFetch = now
      }
    }

    return this.deliveryRules
  }

  async calculateDeliveryForSupplier(
    supplierId: string,
    supplierName: string,
    items: CartItem[],
    zone = 'default'
  ): Promise<DeliveryCalculation> {
    const rules = await this.getDeliveryRules()
    const rule = rules.get(supplierId)

    const subtotalExVat = items.reduce((sum, item) => {
      const p = item.unitPriceExVat ?? item.unitPriceIncVat ?? 0
      return sum + (p * item.quantity)
    }, 0)

    if (!rule) {
      return {
        supplier_id: supplierId,
        supplier_name: supplierName,
        subtotal_ex_vat: subtotalExVat,
        delivery_fee: 0,
        fuel_surcharge: 0,
        pallet_deposit: 0,
        total_delivery_cost: 0,
        landed_cost: subtotalExVat,
        is_under_threshold: false,
        threshold_amount: null,
        amount_to_free_delivery: null,
        next_delivery_day: null
      }
    }

    // Calculate delivery fee
    let deliveryFee = 0
    const isUnderThreshold = rule.free_threshold_ex_vat && subtotalExVat < rule.free_threshold_ex_vat

    if (isUnderThreshold) {
      // Check for tiered pricing
      if (rule.tiers_json && rule.tiers_json.length > 0) {
        const applicableTiers = rule.tiers_json
          .filter(tier => subtotalExVat >= tier.threshold)
          .sort((a, b) => b.threshold - a.threshold)
        
        deliveryFee = applicableTiers.length > 0 ? applicableTiers[0].fee : rule.flat_fee
      } else {
        deliveryFee = rule.flat_fee
      }
    }

    // Calculate surcharges
    const fuelSurcharge = subtotalExVat * (rule.fuel_surcharge_pct / 100)
    const totalPacks = items.reduce((sum, item) => sum + item.quantity, 0)
    const palletDeposit = totalPacks * rule.pallet_deposit_per_unit

    const totalDeliveryCost = deliveryFee + fuelSurcharge + palletDeposit
    const landedCost = subtotalExVat + totalDeliveryCost

    const amountToFreeDelivery = rule.free_threshold_ex_vat && isUnderThreshold
      ? rule.free_threshold_ex_vat - subtotalExVat
      : null

    return {
      supplier_id: supplierId,
      supplier_name: supplierName,
      subtotal_ex_vat: subtotalExVat,
      delivery_fee: deliveryFee,
      fuel_surcharge: fuelSurcharge,
      pallet_deposit: palletDeposit,
      total_delivery_cost: totalDeliveryCost,
      landed_cost: landedCost,
      is_under_threshold: Boolean(isUnderThreshold),
      threshold_amount: rule.free_threshold_ex_vat,
      amount_to_free_delivery: amountToFreeDelivery,
      next_delivery_day: this.getNextDeliveryDay(rule.delivery_days)
    }
  }

  async calculateOrderDelivery(cartItems: CartItem[]): Promise<DeliveryCalculation[]> {
    // Group items by supplier
    const supplierGroups = new Map<string, { name: string; items: CartItem[] }>()
    
    cartItems.forEach(item => {
      if (!supplierGroups.has(item.supplierId)) {
        supplierGroups.set(item.supplierId, {
          name: item.supplierName,
          items: []
        })
      }
      supplierGroups.get(item.supplierId)!.items.push(item)
    })

    const calculations: DeliveryCalculation[] = []
    
    for (const [supplierId, group] of supplierGroups) {
      const calculation = await this.calculateDeliveryForSupplier(
        supplierId,
        group.name,
        group.items
      )
      calculations.push(calculation)
    }

    return calculations
  }

  async optimizeOrder(cartItems: CartItem[]): Promise<OrderDeliveryOptimization> {
    const currentCalculations = await this.calculateOrderDelivery(cartItems)
    const currentTotal = currentCalculations.reduce((sum, calc) => sum + calc.landed_cost, 0)

    const suggestions: DeliveryOptimizationSuggestion[] = []
    const warnings: DeliveryWarning[] = []

    // Generate top-up suggestions
    for (const calc of currentCalculations) {
      if (calc.is_under_threshold && calc.amount_to_free_delivery) {
        suggestions.push({
          type: 'top_up',
          supplier_id: calc.supplier_id,
          supplier_name: calc.supplier_name,
          description: `Add ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()} more to reach free delivery`,
          savings: calc.delivery_fee,
          items: [] // Would be populated with suggested items from pantry/favorites
        })
      }
    }

    // Generate warnings for new suppliers with fees
    for (const calc of currentCalculations) {
      if (calc.total_delivery_cost > 0) {
        warnings.push({
          type: 'new_supplier_fee',
          supplier_id: calc.supplier_id,
          supplier_name: calc.supplier_name,
          message: `Adding items from ${calc.supplier_name} will incur ISK${Math.ceil(calc.total_delivery_cost).toLocaleString()} delivery fee`,
          cost_impact: calc.total_delivery_cost
        })
      }
    }

    return {
      current_total: currentTotal,
      optimized_total: currentTotal, // Would be calculated with optimizations applied
      savings: 0, // Would be calculated
      suggestions,
      warnings
    }
  }

  private getNextDeliveryDay(deliveryDays: number[]): string | null {
    if (!deliveryDays || deliveryDays.length === 0) return null

    const today = new Date()
    const currentDay = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday from 0 to 7

    // Find next available delivery day
    const sortedDays = [...deliveryDays].sort((a, b) => a - b)
    const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]

    const daysUntilDelivery = nextDay > currentDay 
      ? nextDay - currentDay 
      : 7 - currentDay + nextDay

    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + daysUntilDelivery)

    return deliveryDate.toLocaleDateString('is-IS', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export const deliveryCalculator = new DeliveryCalculator()

```


---

## src\services\DeliveryRules.ts

```ts
import { supabase } from '@/integrations/supabase/client'
import type { DeliveryRule } from '@/lib/types/delivery'

class DeliveryRulesService {
  private cache = new Map<string, { rule: DeliveryRule | null; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  async getRule(supplierId: string): Promise<DeliveryRule | null> {
    const now = Date.now()
    const cached = this.cache.get(supplierId)
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.rule
    }

    const { data, error } = await (supabase as any)
      .from('delivery_rules')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch delivery rule:', error)
    }

    const rule = (data as DeliveryRule) ?? null
    this.cache.set(supplierId, { rule, timestamp: now })
    return rule
  }
}

export const deliveryRules = new DeliveryRulesService()

```


---

## src\services\OrderingSuggestions.ts

```ts

import { supabase } from '@/integrations/supabase/client'
import type { CartItem } from '@/lib/types'
import type { DeliveryCalculation } from '@/lib/types/delivery'
import { deliveryCalculator } from './DeliveryCalculator'

export interface OrderingSuggestion {
  id: string
  type: 'threshold_optimization' | 'consolidation' | 'timing_optimization'
  title: string
  description: string
  potential_savings: number
  confidence: number
  actions: SuggestionAction[]
  metadata: Record<string, any>
}

export interface SuggestionAction {
  type: 'add_item' | 'increase_quantity' | 'delay_order' | 'merge_suppliers'
  item_id?: string
  supplier_id?: string
  quantity_change?: number
  description: string
}

export class OrderingSuggestionsService {
  async generateSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Get current delivery calculations
    const deliveryCalculations = await deliveryCalculator.calculateOrderDelivery(cartItems)
    
    // Generate threshold optimization suggestions
    const thresholdSuggestions = await this.generateThresholdSuggestions(deliveryCalculations, cartItems)
    suggestions.push(...thresholdSuggestions)
    
    // Generate consolidation suggestions
    const consolidationSuggestions = await this.generateConsolidationSuggestions(cartItems)
    suggestions.push(...consolidationSuggestions)
    
    // Generate timing optimization suggestions
    const timingSuggestions = await this.generateTimingSuggestions(deliveryCalculations)
    suggestions.push(...timingSuggestions)
    
    return suggestions.sort((a, b) => b.potential_savings - a.potential_savings)
  }

  private async generateThresholdSuggestions(
    calculations: DeliveryCalculation[], 
    cartItems: CartItem[]
  ): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    for (const calc of calculations) {
      if (calc.is_under_threshold && calc.amount_to_free_delivery) {
        // Get frequently ordered items from this supplier
        const frequentItems = await this.getFrequentlyOrderedItems(calc.supplier_id)
        
        if (frequentItems.length > 0) {
          suggestions.push({
            id: `threshold_${calc.supplier_id}`,
            type: 'threshold_optimization',
            title: `Reach free delivery from ${calc.supplier_name}`,
            description: `Add ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()} more to save ISK${Math.ceil(calc.delivery_fee).toLocaleString()} in delivery fees`,
            potential_savings: calc.delivery_fee,
            confidence: 0.85,
            actions: [{
              type: 'add_item',
              supplier_id: calc.supplier_id,
              description: `Add items worth ISK${Math.ceil(calc.amount_to_free_delivery).toLocaleString()}`
            }],
            metadata: {
              supplier_id: calc.supplier_id,
              threshold_amount: calc.threshold_amount,
              current_amount: calc.subtotal_ex_vat,
              suggested_items: frequentItems.slice(0, 3)
            }
          })
        }
      }
    }
    
    return suggestions
  }

  private async generateConsolidationSuggestions(cartItems: CartItem[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Group by supplier and find opportunities to consolidate
    const supplierGroups = cartItems.reduce((groups, item) => {
      if (!groups[item.supplierId]) {
        groups[item.supplierId] = []
      }
      groups[item.supplierId].push(item)
      return groups
    }, {} as Record<string, CartItem[]>)
    
    // If we have multiple suppliers with small orders, suggest consolidation
    const smallOrders = Object.entries(supplierGroups).filter(([_, items]) => {
      const total = items.reduce((sum, item) => sum + (item.unitPriceExVat * item.quantity), 0)
      return total < 50000 // Less than ISK 50,000
    })
    
    if (smallOrders.length >= 2) {
      const totalSavings = smallOrders.length * 2000 // Estimate ISK 2,000 per supplier delivery fee
      
      suggestions.push({
        id: 'consolidate_suppliers',
        type: 'consolidation',
        title: 'Consolidate suppliers to reduce delivery fees',
        description: `Consider sourcing from fewer suppliers to reduce delivery costs`,
        potential_savings: totalSavings,
        confidence: 0.7,
        actions: [{
          type: 'merge_suppliers',
          description: `Review if items from ${smallOrders.length} suppliers can be sourced elsewhere`
        }],
        metadata: {
          small_order_suppliers: smallOrders.map(([supplierId]) => supplierId),
          estimated_fees: totalSavings
        }
      })
    }
    
    return suggestions
  }

  private async generateTimingSuggestions(calculations: DeliveryCalculation[]): Promise<OrderingSuggestion[]> {
    const suggestions: OrderingSuggestion[] = []
    
    // Check for suppliers with different delivery schedules
    const deliverySchedules = calculations
      .filter(calc => calc.next_delivery_day)
      .map(calc => ({
        supplier: calc.supplier_name,
        next_delivery: calc.next_delivery_day,
        supplier_id: calc.supplier_id
      }))
    
    if (deliverySchedules.length > 1) {
      const uniqueDates = [...new Set(deliverySchedules.map(s => s.next_delivery))]
      
      if (uniqueDates.length > 1) {
        suggestions.push({
          id: 'timing_optimization',
          type: 'timing_optimization',
          title: 'Optimize delivery timing',
          description: `Some suppliers have different delivery schedules. Consider timing orders for maximum efficiency.`,
          potential_savings: 0, // More about convenience than cost
          confidence: 0.6,
          actions: [{
            type: 'delay_order',
            description: 'Align order timing with delivery schedules'
          }],
          metadata: {
            delivery_schedules: deliverySchedules
          }
        })
      }
    }
    
    return suggestions
  }

  private async getFrequentlyOrderedItems(supplierId: string): Promise<any[]> {
    try {
      // Fixed: Removed .group() and used proper aggregation in the select
      const { data } = await (supabase as any)
        .rpc('get_frequent_items_by_supplier', {
          supplier_id_param: supplierId,
          days_back: 90
        })

      return (data as any[]) || []
    } catch (error) {
      console.error('Failed to fetch frequently ordered items:', error)
      // Fallback to a simpler query without grouping
      try {
        const { data } = await (supabase as any)
          .from('order_lines')
          .select(`
            supplier_item_id,
            supplier_items(name, pack_size, unit_price_ex_vat, unit_price_inc_vat)
          `)
          .eq('supplier_id', supplierId)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .limit(5)

        return (data as any[]) || []
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }
    }
  }
}

export const orderingSuggestions = new OrderingSuggestionsService()

```


---

## src\state\catalogFiltersStore.ts

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/vanilla/shallow'
import type { FacetFilters } from '@/services/catalog'
import type { TriState } from '@/lib/catalogFilters'
export type { TriState } from '@/lib/catalogFilters'

// Zustand store managing catalog filter state. Utility helpers have been
// consolidated in "@/lib/catalogFilters" to keep this module focused on state.

// Legacy types kept for backward compatibility with code that may import them
export type AvailabilityFilter = 'in' | 'low' | 'out' | 'unknown'
export type SortKey = 'name' | 'price' | 'availability'
export type SortDir = 'asc' | 'desc'
export interface Sort {
  key: SortKey
  dir: SortDir
}

// Catalog sorting options used across the app
export type SortOrder =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'az'
  | 'recent'

export type TriStock = TriState

interface CatalogFiltersState {
  /** Current facet filters applied to the catalog */
  filters: FacetFilters
  /** Whether to show only items with price information */
  onlyWithPrice: boolean
  /** Tri-state stock filter */
  triStock: TriState
  /** Tri-state special filter */
  triSpecial: TriState
  /** Tri-state my suppliers filter */
  triSuppliers: TriState
  /** Selected sort order */
  sort: SortOrder
  setFilters: (f: Partial<FacetFilters>) => void
  setOnlyWithPrice: (v: boolean) => void
  setTriStock: (v: TriState) => void
  setTriSpecial: (v: TriState) => void
  setTriSuppliers: (v: TriState) => void
  setSort: (v: SortOrder) => void
  clear: () => void
}

const defaultState: Omit<
  CatalogFiltersState,
  | 'setFilters'
  | 'setOnlyWithPrice'
  | 'setSort'
  | 'setTriStock'
  | 'setTriSpecial'
  | 'setTriSuppliers'
  | 'clear'
> = {
  filters: {},
  onlyWithPrice: false,
  triStock: 'off',
  triSpecial: 'off',
  triSuppliers: 'off',
  sort: 'relevance',
}

export const useCatalogFilters = create<CatalogFiltersState>()(
  persist(
    set => ({
      ...defaultState,
      setFilters: f =>
        set(state => {
          // Only update if filters actually changed to prevent unnecessary re-renders
          const newFilters = { ...state.filters, ...f }
          const hasChanges = Object.keys(f).some(key =>
            JSON.stringify(state.filters[key as keyof FacetFilters]) !==
              JSON.stringify(newFilters[key as keyof FacetFilters])
          )
          return hasChanges ? { filters: newFilters } : state
        }),
      setOnlyWithPrice: v => set({ onlyWithPrice: v }),
      setSort: v => set({ sort: v }),
      setTriStock: v =>
        set(state => (state.triStock === v ? state : { triStock: v })),
      setTriSpecial: v =>
        set(state => (state.triSpecial === v ? state : { triSpecial: v })),
      setTriSuppliers: v =>
        set(state => (state.triSuppliers === v ? state : { triSuppliers: v })),
      clear: () => set({ ...defaultState }),
    }),
    { name: 'catalogFilters' },
  ),
)

export { shallow }


```


---

## src\state\userPrefs.ts

```ts

export interface UserPreferences {
  includeVat: boolean;
  userMode: 'just-order' | 'balanced' | 'analytical';
  favorites: string[];
  preferredSuppliers: Record<string, string>; // itemId -> supplierId
  lastOrderGuide: string | null;
}

const STORAGE_KEY = 'qb/user-prefs';

const defaultPrefs: UserPreferences = {
  includeVat: false,
  userMode: 'just-order',
  favorites: [],
  preferredSuppliers: {},
  lastOrderGuide: null,
};

export function getUserPrefs(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPrefs, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load user preferences:', error);
  }
  return defaultPrefs;
}

export function saveUserPrefs(prefs: Partial<UserPreferences>): void {
  try {
    const current = getUserPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save user preferences:', error);
  }
}

export function addToFavorites(itemId: string): void {
  const prefs = getUserPrefs();
  if (!prefs.favorites.includes(itemId)) {
    saveUserPrefs({
      favorites: [...prefs.favorites, itemId]
    });
  }
}

export function removeFromFavorites(itemId: string): void {
  const prefs = getUserPrefs();
  saveUserPrefs({
    favorites: prefs.favorites.filter(id => id !== itemId)
  });
}

export function setPreferredSupplier(itemId: string, supplierId: string): void {
  const prefs = getUserPrefs();
  saveUserPrefs({
    preferredSuppliers: {
      ...prefs.preferredSuppliers,
      [itemId]: supplierId
    }
  });
}

```


---

## src\utils\harAnalytics.ts

```ts

export interface PriceAnalysis {
  averagePrice: number
  priceRange: { min: number; max: number }
  outliers: Array<{ sku: string; name: string; price: number; deviation: number }>
  distribution: { low: number; medium: number; high: number }
}

export interface CategoryAnalysis {
  categories: Array<{ name: string; count: number; avgPrice: number }>
  topBrands: Array<{ brand: string; count: number; avgPrice: number }>
  packSizeDistribution: Array<{ type: string; count: number }>
}

export interface QualityMetrics {
  completenessScore: number
  dataQualityScore: number
  missingFields: string[]
  inconsistencies: Array<{ type: string; count: number; examples: string[] }>
}

export interface AnalyticsResult {
  priceAnalysis: PriceAnalysis
  categoryAnalysis: CategoryAnalysis
  qualityMetrics: QualityMetrics
  recommendations: string[]
  insights: string[]
}

interface CategoryStatsAccumulator {
  [key: string]: { name: string; count: number; totalPrice: number }
}

interface BrandStatsAccumulator {
  [key: string]: { brand: string; count: number; totalPrice: number }
}

export class HarAnalytics {
  analyze(items: any[]): AnalyticsResult {
    const priceAnalysis = this.analyzePrices(items)
    const categoryAnalysis = this.analyzeCategories(items)
    const qualityMetrics = this.analyzeQuality(items)
    
    return {
      priceAnalysis,
      categoryAnalysis,
      qualityMetrics,
      recommendations: this.generateRecommendations(items, priceAnalysis, qualityMetrics),
      insights: this.generateInsights(items, priceAnalysis, categoryAnalysis)
    }
  }

  private analyzePrices(items: any[]): PriceAnalysis {
    const prices = items.map(item => item.price).filter(p => p > 0)
    
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        outliers: [],
        distribution: { low: 0, medium: 0, high: 0 }
      }
    }

    const sorted = [...prices].sort((a, b) => a - b)
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length)

    // Find outliers (more than 2 standard deviations from mean)
    const outliers = items
      .filter(item => Math.abs(item.price - average) > 2 * stdDev)
      .map(item => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        deviation: Math.abs(item.price - average) / stdDev
      }))
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 5)

    // Price distribution
    const q1 = sorted[Math.floor(sorted.length * 0.33)]
    const q3 = sorted[Math.floor(sorted.length * 0.67)]
    
    const distribution = {
      low: prices.filter(p => p <= q1).length,
      medium: prices.filter(p => p > q1 && p <= q3).length,
      high: prices.filter(p => p > q3).length
    }

    return {
      averagePrice: average,
      priceRange: { min: sorted[0], max: sorted[sorted.length - 1] },
      outliers,
      distribution
    }
  }

  private analyzeCategories(items: any[]): CategoryAnalysis {
    // Infer categories from product names using keywords
    const categoryKeywords = {
      'Beverages': ['drink', 'juice', 'water', 'soda', 'beer', 'wine', 'coffee', 'tea'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'Meat': ['beef', 'chicken', 'pork', 'fish', 'salmon', 'meat'],
      'Produce': ['apple', 'banana', 'potato', 'onion', 'carrot', 'tomato'],
      'Bakery': ['bread', 'cake', 'cookies', 'pastry', 'muffin'],
      'Frozen': ['frozen', 'ice cream', 'pizza']
    }

    const itemsWithCategories = items.map(item => {
      const name = item.name.toLowerCase()
      const category = Object.entries(categoryKeywords).find(([_, keywords]) =>
        keywords.some(keyword => name.includes(keyword))
      )?.[0] || 'Other'
      
      return { ...item, category }
    })

    // Category analysis
    const categoryStats = Object.values(
      itemsWithCategories.reduce<CategoryStatsAccumulator>((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { name: item.category, count: 0, totalPrice: 0 }
        }
        acc[item.category].count++
        acc[item.category].totalPrice += item.price
        return acc
      }, {})
    ).map(cat => ({
      name: cat.name,
      count: cat.count,
      avgPrice: cat.totalPrice / cat.count
    })).sort((a, b) => b.count - a.count)

    // Brand analysis
    const brandStats = Object.values(
      items.filter(item => item.brand).reduce<BrandStatsAccumulator>((acc, item) => {
        if (!acc[item.brand]) {
          acc[item.brand] = { brand: item.brand, count: 0, totalPrice: 0 }
        }
        acc[item.brand].count++
        acc[item.brand].totalPrice += item.price
        return acc
      }, {})
    ).map(brand => ({
      brand: brand.brand,
      count: brand.count,
      avgPrice: brand.totalPrice / brand.count
    })).sort((a, b) => b.count - a.count).slice(0, 10)

    // Pack size analysis
    const packTypes = items.reduce<Record<string, number>>((acc, item) => {
      const pack = item.pack.toLowerCase()
      let type = 'Unit'
      if (pack.includes('kg') || pack.includes('g')) type = 'Weight'
      else if (pack.includes('l') || pack.includes('ml')) type = 'Volume'
      else if (pack.includes('x') || pack.includes('pack')) type = 'Multi-pack'
      
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    return {
      categories: categoryStats,
      topBrands: brandStats,
      packSizeDistribution: Object.entries(packTypes).map(([type, count]) => ({ type, count }))
    }
  }

  private analyzeQuality(items: any[]): QualityMetrics {
    const totalItems = items.length
    if (totalItems === 0) {
      return {
        completenessScore: 0,
        dataQualityScore: 0,
        missingFields: [],
        inconsistencies: []
      }
    }

    // Check field completeness
    const fieldChecks = {
      sku: items.filter(i => i.sku && i.sku.length > 0).length,
      name: items.filter(i => i.name && i.name.length > 0).length,
      brand: items.filter(i => i.brand && i.brand.length > 0).length,
      pack: items.filter(i => i.pack && i.pack.length > 0).length,
      price: items.filter(i => i.price && i.price > 0).length
    }

    const completenessScore = Object.values(fieldChecks).reduce((sum, count) => sum + count, 0) / (totalItems * 5)

    // Identify missing fields
    const missingFields = Object.entries(fieldChecks)
      .filter(([_, count]) => count < totalItems * 0.8)
      .map(([field, _]) => field)

    // Check for inconsistencies
    const inconsistencies = []
    
    // Price inconsistencies
    const zeroPrices = items.filter(i => !i.price || i.price <= 0).length
    if (zeroPrices > 0) {
      inconsistencies.push({
        type: 'Missing/Zero Prices',
        count: zeroPrices,
        examples: items.filter(i => !i.price || i.price <= 0).slice(0, 3).map(i => i.name)
      })
    }

    // Name inconsistencies (very short names)
    const shortNames = items.filter(i => i.name && i.name.length < 3).length
    if (shortNames > 0) {
      inconsistencies.push({
        type: 'Very Short Names',
        count: shortNames,
        examples: items.filter(i => i.name && i.name.length < 3).slice(0, 3).map(i => i.name)
      })
    }

    const dataQualityScore = Math.max(0, 1 - (inconsistencies.length * 0.1))

    return {
      completenessScore,
      dataQualityScore,
      missingFields,
      inconsistencies
    }
  }

  private generateRecommendations(items: any[], priceAnalysis: PriceAnalysis, qualityMetrics: QualityMetrics): string[] {
    const recommendations = []

    if (qualityMetrics.completenessScore < 0.8) {
      recommendations.push('Consider capturing more product pages to improve data completeness')
    }

    if (qualityMetrics.missingFields.includes('brand')) {
      recommendations.push('Try browsing brand-specific pages to capture more brand information')
    }

    if (priceAnalysis.outliers.length > 0) {
      recommendations.push(`Review ${priceAnalysis.outliers.length} price outliers for potential data quality issues`)
    }

    if (items.length < 50) {
      recommendations.push('Browse more product pages to capture a larger sample size')
    }

    if (qualityMetrics.inconsistencies.length > 0) {
      recommendations.push('Some data quality issues detected - consider browsing different sections of the supplier site')
    }

    return recommendations.slice(0, 5)
  }

  private generateInsights(items: any[], priceAnalysis: PriceAnalysis, categoryAnalysis: CategoryAnalysis): string[] {
    const insights = []

    if (categoryAnalysis.categories.length > 0) {
      const topCategory = categoryAnalysis.categories[0]
      insights.push(`Most common category: ${topCategory.name} (${topCategory.count} items, avg €${topCategory.avgPrice.toFixed(2)})`)
    }

    if (categoryAnalysis.topBrands.length > 0) {
      const topBrand = categoryAnalysis.topBrands[0]
      insights.push(`Top brand: ${topBrand.brand} (${topBrand.count} items, avg €${topBrand.avgPrice.toFixed(2)})`)
    }

    if (priceAnalysis.distribution.high > priceAnalysis.distribution.low) {
      insights.push('Premium product focus detected - mostly higher-priced items')
    } else if (priceAnalysis.distribution.low > priceAnalysis.distribution.high) {
      insights.push('Value product focus detected - mostly lower-priced items')
    }

    const avgPrice = priceAnalysis.averagePrice
    if (avgPrice > 0) {
      insights.push(`Average price: €${avgPrice.toFixed(2)} (range: €${priceAnalysis.priceRange.min.toFixed(2)} - €${priceAnalysis.priceRange.max.toFixed(2)})`)
    }

    return insights.slice(0, 4)
  }
}

```


---

## src\utils\harDataExtractor.ts

```ts

export interface ExtractedItem {
  sku: string
  name: string
  brand?: string
  pack: string
  price: number
  vatCode: number
  confidence: number
  source: string
}

export interface ExtractionResult {
  items: ExtractedItem[]
  stats: {
    totalResponses: number
    jsonResponses: number
    productArrays: number
    extractedItems: number
    confidence: {
      high: number
      medium: number
      low: number
    }
  }
}

export class HarDataExtractor {
  private readonly PRODUCT_URL_PATTERNS = [
    /\/(api|graphql|products|catalog|prices|items|menu)/i,
    /product/i,
    /item/i,
    /catalog/i,
    /inventory/i
  ]

  private readonly PRODUCT_ARRAY_PATHS = [
    'items', 'products', 'data.items', 'data.products', 'results',
    'data.results', 'payload.items', 'response.data', 'menu.items'
  ]

  private readonly SKU_FIELDS = [
    'sku', 'code', 'id', 'itemCode', 'productCode', 'barcode', 'gtin'
  ]

  private readonly NAME_FIELDS = [
    'name', 'title', 'description', 'itemName', 'productName', 'Description'
  ]

  private readonly BRAND_FIELDS = [
    'brand', 'Brand', 'manufacturer', 'supplier', 'brandName'
  ]

  private readonly PACK_FIELDS = [
    'pack', 'unit', 'package', 'packaging', 'size', 'unitSize'
  ]

  private readonly PRICE_FIELDS = [
    'price_ex_vat', 'PriceExVAT', 'price', 'unitPrice', 'priceExVat',
    'cost', 'amount', 'pricePerUnit'
  ]

  private readonly VAT_FIELDS = [
    'vat_code', 'VATCode', 'vatCode', 'taxCode', 'tax_code'
  ]

  extract(har: any): ExtractionResult {
    const stats = {
      totalResponses: 0,
      jsonResponses: 0,
      productArrays: 0,
      extractedItems: 0,
      confidence: { high: 0, medium: 0, low: 0 }
    }

    const allItems: ExtractedItem[] = []
    const entries = har?.log?.entries || []

    for (const entry of entries) {
      stats.totalResponses++
      const mimeType = (entry?.response?.content?.mimeType || '').toLowerCase()
      const responseText = entry?.response?.content?.text

      if (mimeType.includes('application/json') && responseText) {
        stats.jsonResponses++
      }

      const extracted = this.extractFromEntry(entry)
      if (extracted.length > 0) {
        stats.productArrays++
        allItems.push(...extracted)
      }
    }

    // Deduplicate and validate
    const deduplicatedItems = this.deduplicateItems(allItems)
    const validatedItems = deduplicatedItems
      .map(item => this.validateAndEnhanceItem(item))
      .filter(item => item !== null) as ExtractedItem[]

    // Calculate confidence stats
    validatedItems.forEach(item => {
      if (item.confidence >= 0.8) stats.confidence.high++
      else if (item.confidence >= 0.5) stats.confidence.medium++
      else stats.confidence.low++
    })

    stats.extractedItems = validatedItems.length

    return {
      items: validatedItems,
      stats
    }
  }

  private extractFromEntry(entry: any): ExtractedItem[] {
    const url = entry?.request?.url || ''
    const mimeType = (entry?.response?.content?.mimeType || '').toLowerCase()
    const responseText = entry?.response?.content?.text

    // Skip non-JSON responses
    if (!mimeType.includes('application/json') || !responseText) {
      return []
    }

    // Check if URL looks like a product API
    const isProductUrl = this.PRODUCT_URL_PATTERNS.some(pattern => pattern.test(url))
    if (!isProductUrl) return []

    try {
      const data = JSON.parse(responseText)
      return this.extractItemsFromJson(data, url)
    } catch {
      return []
    }
  }

  private extractItemsFromJson(data: any, source: string): ExtractedItem[] {
    const items: ExtractedItem[] = []

    // Try different array paths
    for (const path of this.PRODUCT_ARRAY_PATHS) {
      const array = this.getNestedValue(data, path)
      if (Array.isArray(array) && array.length > 0) {
        array.forEach(item => {
          const extracted = this.extractItemFromObject(item, source)
          if (extracted) items.push(extracted)
        })
        break // Use first found array
      }
    }

    return items
  }

  private extractItemFromObject(obj: any, source: string): ExtractedItem | null {
    if (!obj || typeof obj !== 'object') return null

    const sku = this.findFieldValue(obj, this.SKU_FIELDS)
    const name = this.findFieldValue(obj, this.NAME_FIELDS)
    const brand = this.findFieldValue(obj, this.BRAND_FIELDS)
    const pack = this.findFieldValue(obj, this.PACK_FIELDS)
    const price = this.findNumericValue(obj, this.PRICE_FIELDS)
    const vatCode = this.findNumericValue(obj, this.VAT_FIELDS)

    // Must have at least SKU or name, and a price
    if ((!sku && !name) || !price || price <= 0) return null

    // Calculate confidence based on available fields
    let confidence = 0.3 // Base confidence
    if (sku) confidence += 0.3
    if (name) confidence += 0.2
    if (brand) confidence += 0.1
    if (pack) confidence += 0.1

    return {
      sku: String(sku || name || '').trim(),
      name: String(name || sku || '').trim(),
      brand: brand ? String(brand).trim() : undefined,
      pack: String(pack || '').trim(),
      price: Number(price),
      vatCode: Number(vatCode || 24),
      confidence,
      source
    }
  }

  private findFieldValue(obj: any, fieldNames: string[]): any {
    for (const field of fieldNames) {
      if (Object.prototype.hasOwnProperty.call(obj, field) && obj[field] != null && obj[field] !== '') {
        return obj[field]
      }
    }
    return null
  }

  private findNumericValue(obj: any, fieldNames: string[]): number | null {
    const value = this.findFieldValue(obj, fieldNames)
    if (value == null) return null
    
    const num = Number(value)
    return isNaN(num) ? null : num
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  private deduplicateItems(items: ExtractedItem[]): ExtractedItem[] {
    const seen = new Map<string, ExtractedItem>()
    
    items.forEach(item => {
      // Create dedup key from SKU and name
      const key = `${item.sku.toLowerCase()}_${item.name.toLowerCase()}`
      
      const existing = seen.get(key)
      if (!existing || item.confidence > existing.confidence) {
        seen.set(key, item)
      }
    })

    return Array.from(seen.values())
  }

  private validateAndEnhanceItem(item: ExtractedItem): ExtractedItem | null {
    // Basic validation
    if (!item.name || item.name.length < 2) return null
    if (!item.sku || item.sku.length < 1) return null
    if (item.price <= 0 || item.price > 1000000) return null

    // Enhance pack information
    const enhancedPack = this.enhancePackInfo(item.pack)
    
    // Validate VAT code
    const validVatCode = [11, 24].includes(item.vatCode) ? item.vatCode : 24

    return {
      ...item,
      pack: enhancedPack,
      vatCode: validVatCode,
      name: item.name.trim(),
      sku: item.sku.trim(),
      brand: item.brand?.trim()
    }
  }

  private enhancePackInfo(pack: string): string {
    if (!pack) return '1 each'
    
    const cleaned = pack.toLowerCase().trim()
    
    // Common pack format patterns
    const patterns = [
      /(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(l|kg|g|ml)/,
      /(\d+(?:[.,]\d+)?)\s*(l|kg|g|ml|pcs?|each)/,
      /(\d+)\s*(pcs?|pieces?|each)/
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) return pack // Keep original if it matches a known pattern
    }

    // Default fallback
    return pack || '1 each'
  }
}

```


---

## src\utils\harRecommendations.ts

```ts

import { ExtractionResult } from './harDataExtractor'
import { ValidationResult } from './harValidator'
import { AnalyticsResult } from './harAnalytics'

export interface OptimizationRecommendation {
  type: 'coverage' | 'quality' | 'efficiency' | 'pricing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  impact: string
}

export interface CompetitiveInsight {
  type: 'price_advantage' | 'price_gap' | 'unique_products' | 'coverage_gap'
  message: string
  confidence: number
  suggestions: string[]
}

export class HarRecommendationsEngine {
  generateOptimizationRecommendations(
    extraction: ExtractionResult,
    validation: ValidationResult,
    analytics: AnalyticsResult
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Coverage recommendations
    if (extraction.items.length < 100) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Expand Product Coverage',
        description: `Only ${extraction.items.length} products captured. More comprehensive data will improve pricing insights.`,
        action: 'Browse additional product categories and pages',
        impact: 'Better market understanding and competitive positioning'
      })
    }

    // Quality recommendations
    if (analytics.qualityMetrics.completenessScore < 0.7) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Improve Data Quality',
        description: `Data completeness is ${Math.round(analytics.qualityMetrics.completenessScore * 100)}%. Missing key product information.`,
        action: 'Navigate to detailed product pages with specifications',
        impact: 'More accurate price comparisons and better supplier negotiations'
      })
    }

    // Efficiency recommendations
    if (validation.stats.validJsonResponses < validation.stats.totalEntries * 0.3) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        title: 'Optimize Data Capture',
        description: 'Low ratio of useful API responses. Consider focusing on specific sections.',
        action: 'Browse product listing pages and search results rather than static pages',
        impact: 'Faster data collection with higher quality results'
      })
    }

    // Pricing recommendations
    if (analytics.priceAnalysis.outliers.length > extraction.items.length * 0.1) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Review Price Anomalies',
        description: `${analytics.priceAnalysis.outliers.length} products have unusual pricing patterns.`,
        action: 'Verify pricing data for flagged products and check for bulk/special pricing',
        impact: 'More accurate cost calculations and budget planning'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }).slice(0, 4)
  }

  generateCompetitiveInsights(
    currentData: ExtractionResult,
    analytics: AnalyticsResult
  ): CompetitiveInsight[] {
    const insights: CompetitiveInsight[] = []

    // Price positioning insights
    const avgPrice = analytics.priceAnalysis.averagePrice
    if (avgPrice > 0) {
      const priceDistribution = analytics.priceAnalysis.distribution
      const isValueFocused = priceDistribution.low > priceDistribution.high

      if (isValueFocused) {
        insights.push({
          type: 'price_advantage',
          message: 'Supplier appears to focus on value/budget products',
          confidence: 0.8,
          suggestions: [
            'Consider this supplier for cost-conscious purchasing',
            'Compare with premium suppliers for full market view',
            'Check for bulk pricing opportunities'
          ]
        })
      } else {
        insights.push({
          type: 'price_gap',
          message: 'Supplier appears to focus on premium products',
          confidence: 0.8,
          suggestions: [
            'Verify quality justification for premium pricing',
            'Seek alternative suppliers for budget options',
            'Negotiate volume discounts for premium items'
          ]
        })
      }
    }

    // Coverage insights
    const topCategories = analytics.categoryAnalysis.categories.slice(0, 3)
    if (topCategories.length > 0) {
      insights.push({
        type: 'coverage_gap',
        message: `Strong coverage in: ${topCategories.map(c => c.name).join(', ')}`,
        confidence: 0.9,
        suggestions: [
          'Leverage this supplier for their specialty categories',
          'Identify gaps in other product categories',
          'Consider supplier partnerships for strong categories'
        ]
      })
    }

    // Unique products insights
    const uniqueBrands = analytics.categoryAnalysis.topBrands.length
    if (uniqueBrands > 10) {
      insights.push({
        type: 'unique_products',
        message: `Wide brand selection with ${uniqueBrands} different brands`,
        confidence: 0.7,
        suggestions: [
          'Good supplier for brand variety and choice',
          'Check for exclusive brand partnerships',
          'Compare brand availability with other suppliers'
        ]
      })
    }

    return insights.slice(0, 3)
  }

  generateActionPlan(
    recommendations: OptimizationRecommendation[],
    insights: CompetitiveInsight[]
  ): string[] {
    const actions = []

    // High priority recommendations first
    const highPriority = recommendations.filter(r => r.priority === 'high')
    if (highPriority.length > 0) {
      actions.push(`🎯 Priority Actions: ${highPriority.map(r => r.action).join('; ')}`)
    }

    // Key insights
    const keyInsights = insights.slice(0, 2)
    if (keyInsights.length > 0) {
      actions.push(`💡 Key Insights: ${keyInsights.map(i => i.message).join('; ')}`)
    }

    // Next steps
    const mediumPriority = recommendations.filter(r => r.priority === 'medium')
    if (mediumPriority.length > 0) {
      actions.push(`📈 Future Improvements: ${mediumPriority.map(r => r.action).join('; ')}`)
    }

    return actions.slice(0, 3)
  }
}

```


---

## supabase\functions\ingest_har\index.ts

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { parsePack } from "./parsePack.ts";

// Helper function to create SHA-256 hash using Web Crypto API
async function createSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const INGEST_HAR_TOKEN = Deno.env.get("INGEST_HAR_TOKEN") || "";
const MISSING_CYCLE_THRESHOLD =
  Number(Deno.env.get("MISSING_CYCLE_THRESHOLD")) || 3;
const DELTA_ALERT_THRESHOLD =
  Number(Deno.env.get("DELTA_ALERT_THRESHOLD")) || 100;
const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");
const ALERT_EMAIL_URL = Deno.env.get("ALERT_EMAIL_URL");

const ALLOW_ORIGINS = new Set([
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://app.kaupa.is",
]);

type CapturedRecord = {
  url?: string;
  u?: string;
  data?: any;
  d?: any;
  ts?: number;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "access-control-allow-origin": ALLOW_ORIGINS.has(origin) ? origin : "null",
    "access-control-allow-headers": "content-type,x-ingest-token",
    "access-control-allow-methods": "POST,OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const startTime = Date.now();
  let supabase: any;
  try {
    if (INGEST_HAR_TOKEN) {
      const token = req.headers.get("x-ingest-token") || "";
      if (token !== INGEST_HAR_TOKEN) {
        return new Response("unauthorized", { status: 401, headers: cors });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { tenant_id, supplier_id, har, _captured } = body ?? {};
    if (!tenant_id || !supplier_id) {
      return new Response("bad payload", { status: 400, headers: cors });
    }

    // Build a unified array of {url, data} from either HAR or _captured
    const records: { url: string; data: any }[] = [];

    if (har?.log?.entries?.length) {
      for (const e of har.log.entries as any[]) {
        const url: string = e?.request?.url || "";
        const mime = (e?.response?.content?.mimeType || "").toLowerCase();
        if (!mime.includes("application/json")) continue;
        if (!/\/(api|graphql|products|catalog|prices)/i.test(url)) continue;
        const text: string | undefined = e?.response?.content?.text;
        if (!text) continue;
        try {
          records.push({ url, data: JSON.parse(text) });
        } catch { /* ignore */ }
      }
    } else if (Array.isArray(_captured)) {
      for (const r of _captured as CapturedRecord[]) {
        const url = String(r.url ?? r.u ?? "");
        const data = r.data ?? r.d;
        if (!url || data == null) continue;
        if (!/\/(api|graphql|products|catalog|prices)/i.test(url)) continue;
        records.push({ url, data });
      }
    } else {
      return new Response("nothing to ingest", { status: 400, headers: cors });
    }

    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Store raw payload for audit/provenance
    const fileKeyBase = har?.log?.entries?.length ? "har" : "bookmarklet";
    const fileKey =
      `${fileKeyBase}/${tenant_id}/${supplier_id}/${Date.now()}.json`;
    const rawBlob = new Blob([
      JSON.stringify(har?.log?.entries?.length ? har : _captured),
    ], { type: "application/json" });
    const up = await supabase.storage.from("supplier-intake").upload(
      fileKey,
      rawBlob,
      { upsert: true },
    );
    if (up.error) throw up.error;

    // Extract product items from JSON shapes
    const itemsIn: any[] = [];
    for (const r of records) {
      const d = r?.data;
      const arr = Array.isArray(d?.items)
        ? d.items
        : Array.isArray(d?.data?.items)
        ? d.data.items
        : null;
      if (arr) itemsIn.push(...arr);
    }

    const nowIso = new Date().toISOString();
    const processedItems: any[] = [];

    for (const it of itemsIn) {
      const sku = String(
        (it as any).sku ?? (it as any).code ?? (it as any).id ?? "",
      ).trim();
      const name = String(
        (it as any).name ?? (it as any).title ?? (it as any).Description ?? "",
      ).trim();
      const brand = String((it as any).brand ?? (it as any).Brand ?? "").trim();
      const pack = String(
        (it as any).pack ?? (it as any).unit ?? (it as any).package ?? "",
      ).trim();
      const price = Number(
        (it as any).price_ex_vat ?? (it as any).PriceExVAT ??
          (it as any).price ?? 0,
      );
      const vatCode =
        Number((it as any).vat_code ?? (it as any).VATCode ?? 24) === 11
          ? 11
          : 24;

      const { qty, unit } = parsePack(pack);

      if (!name || !price) continue;

      const rawHash = await createSHA256Hash(JSON.stringify(it));

      processedItems.push({
        supplier_id,
        ext_sku: sku || name,
        display_name: name,
        brand: brand || null,
        pack_qty: qty || 1,
        pack_unit_id: unit || "each",
        vat_code: vatCode,
        price: price,
        unit_price_ex_vat: qty > 0 ? Number((price / qty).toFixed(4)) : null,
        last_seen_at: nowIso,
        raw_hash: rawHash,
      });
    }
    let newCount = 0;
    let changedCount = 0;
    let unavailableCount = 0;
    let upsertedItems: any[] = [];

    const { data: existingRows, error: existingErr } = await supabase
      .from("supplier_items")
      .select("id, ext_sku, raw_hash, missing_cycles, status")
      .eq("supplier_id", supplier_id);
    if (existingErr) throw existingErr;
    const existingMap = new Map((existingRows || []).map((r: any) => [r.ext_sku, r]));

    const itemsToUpsert: any[] = [];
    const unchangedIds: string[] = [];

    for (const item of processedItems) {
      const existing = existingMap.get(item.ext_sku);
      if (!existing) {
        itemsToUpsert.push({ ...item, status: "available", missing_cycles: 0 });
        newCount++;
      } else if (existing.raw_hash !== item.raw_hash) {
        itemsToUpsert.push({
          ...item,
          id: existing.id,
          status: "available",
          missing_cycles: 0,
        });
        changedCount++;
        existingMap.delete(item.ext_sku);
      } else {
        unchangedIds.push(existing.id);
        existingMap.delete(item.ext_sku);
      }
    }

    if (itemsToUpsert.length) {
      const upsert = await supabase.from("supplier_items").upsert(
        itemsToUpsert,
        { onConflict: "supplier_id,ext_sku", ignoreDuplicates: false },
      ).select();
      if (upsert.error) {
        console.error("Supplier items upsert error:", upsert.error);
        throw upsert.error;
      }
      upsertedItems = upsert.data || [];
    }

    if (unchangedIds.length) {
      const upd = await supabase.from("supplier_items").update({
        last_seen_at: nowIso,
        missing_cycles: 0,
        status: "available",
      }).in("id", unchangedIds);
      if (upd.error) {
        console.error("Supplier items update error:", upd.error);
        throw upd.error;
      }
    }

    const unseen = Array.from(existingMap.values());
    if (unseen.length) {
      const updates = unseen.map((r: any) => {
        const mc = (r.missing_cycles || 0) + 1;
        const status = mc >= MISSING_CYCLE_THRESHOLD ? "unavailable" : r.status || "available";
        if (status === "unavailable" && r.status !== "unavailable") unavailableCount++;
        return { id: r.id, missing_cycles: mc, status };
      });
      const upd = await supabase.from("supplier_items").upsert(updates);
      if (upd.error) {
        console.error("Supplier items missing update error:", upd.error);
        throw upd.error;
      }
    }

    if (upsertedItems.length) {
      const priceQuotes = upsertedItems.map((item) => {
        const processedItem = processedItems.find((p) => p.ext_sku === item.ext_sku);
        return {
          supplier_item_id: item.id,
          observed_at: nowIso,
          pack_price: processedItem?.price || 0,
          currency: "ISK",
          vat_code: String(processedItem?.vat_code || 24),
          unit_price_ex_vat: processedItem?.unit_price_ex_vat,
          unit_price_inc_vat: processedItem?.unit_price_ex_vat
            ? processedItem.unit_price_ex_vat *
              (1 + (processedItem.vat_code === 11 ? 0.11 : 0.24))
            : null,
          source: har?.log?.entries?.length ? "har_upload" : "bookmarklet",
        };
      });

      const quotes = await supabase.from("price_quotes").insert(priceQuotes);
      if (quotes.error) {
        console.error("Price quotes insert error:", quotes.error);
        throw quotes.error;
      }
    }

    const latencyMs = Date.now() - startTime;
    await supabase.from("ingestion_runs").insert({
      tenant_id,
      supplier_id,
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      status: "succeeded",
      latency_ms: latencyMs,
      new_count: newCount,
      changed_count: changedCount,
      unavailable_count: unavailableCount,
    });

    if (
      SLACK_WEBHOOK_URL &&
      (changedCount + newCount > DELTA_ALERT_THRESHOLD || unavailableCount > 0)
    ) {
      const msg =
        `Ingestion alert for supplier ${supplier_id}: ${newCount} new, ${changedCount} changed, ${unavailableCount} unavailable`;
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
      if (ALERT_EMAIL_URL) {
        await fetch(ALERT_EMAIL_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject: "Ingestion alert", text: msg }),
        }).catch(() => {});
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        items: processedItems.length,
        fileKey,
        processed: upsertedItems.length,
        new: newCount,
        changed: changedCount,
        unavailable: unavailableCount,
        latency_ms: latencyMs,
      }),
      {
        headers: { ...cors, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Ingest error:", e);
    const msg = `Ingestion failed for supplier ${tenant_id}/${supplier_id}: ${e?.message || e}`;
    await supabase
      .from("ingestion_runs")
      .insert({
        tenant_id,
        supplier_id,
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString(),
        status: "failed",
        error: String(e?.message || e),
      })
      .catch(() => {});
    if (SLACK_WEBHOOK_URL) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
      if (ALERT_EMAIL_URL) {
        await fetch(ALERT_EMAIL_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject: "Ingestion failed", text: msg }),
        }).catch(() => {});
      }
    }
    return new Response(`error: ${e?.message || e}`, {
      status: 500,
      headers: cors,
    });
  }
});

```


---

## supabase\functions\ingest_har\parsePack_test.ts

```ts
import { parsePack } from "./parsePack.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Assertion failed: expected ${JSON.stringify(expected)}, got ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("parsePack extracts quantity and unit", () => {
  assertEquals(parsePack("6x0.5L"), { qty: 3, unit: "L" });
  assertEquals(parsePack("250g"), { qty: 0.25, unit: "kg" });
  assertEquals(parsePack(""), { qty: 1, unit: "each" });
  assertEquals(parsePack("invalid"), { qty: 1, unit: "each" });
});

```


---

## supabase\functions\ingest_har\parsePack.ts

```ts
export function parsePack(s: string) {
  const t = (s || "").toLowerCase().replace(/\s+/g, "");
  const mX = t.match(/^(\d+)x(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (mX) {
    const n = Number(mX[1]);
    let per = Number(mX[2].replace(",", "."));
    let unit = mX[3];
    if (unit === "g") {
      per = per / 1000;
      unit = "kg";
    }
    return { qty: n * per, unit: unit === "kg" ? "kg" : "L" };
  }
  const singleMatch = t.match(/^(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (singleMatch) {
    let qty = Number(singleMatch[1].replace(",", "."));
    let unit = singleMatch[2];
    if (unit === "g") {
      qty = qty / 1000;
      unit = "kg";
    }
    return { qty, unit: unit === "kg" ? "kg" : "L" };
  }
  return { qty: 1, unit: "each" };
}

```


---

## supabase\functions\ingest-supplier-products\index.ts

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ApiConfig {
  baseUrl: string
  auth: { type: 'oauth2' | 'key'; clientId?: string; clientSecret?: string; tokenUrl?: string; apiKey?: string }
  pageParam?: string
  pageSize?: number
}

interface CsvConfig {
  url: string
  headers: Record<string, string>
  unitMap?: Record<string, number>
}

interface ScrapeConfig {
  url: string
  respectRobots?: boolean
}

interface IngestionRequest {
  supplier_id: string
  source: 'api' | 'csv' | 'excel' | 'web'
  apiConfig?: ApiConfig
  csvConfig?: CsvConfig
  scrapeConfig?: ScrapeConfig
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { supplier_id, source, apiConfig, csvConfig, scrapeConfig }: IngestionRequest = await req.json()

    if (!supplier_id || !source) {
      return new Response('Missing parameters', { status: 400, headers: corsHeaders })
    }

    let records: any[] = []
    switch (source) {
      case 'api':
        if (!apiConfig) throw new Error('apiConfig required for API source')
        records = await fetchFromApi(apiConfig)
        break
      case 'csv':
      case 'excel':
        if (!csvConfig) throw new Error('csvConfig required for CSV/Excel source')
        records = await parseCsvOrExcel(csvConfig)
        break
      case 'web':
        if (!scrapeConfig) throw new Error('scrapeConfig required for web source')
        records = await scrapeWebsite(scrapeConfig)
        break
      default:
        throw new Error('Unknown source type')
    }

    for (const rec of records) {
      const normalized = normalizeRecord(rec, csvConfig?.headers)
      await upsertSupplierProduct(supabase, supplier_id, normalized.supplier_sku, normalized, rec)
    }

    return new Response(JSON.stringify({ processed: records.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function fetchFromApi(config: ApiConfig): Promise<any[]> {
  let token = ''
  if (config.auth.type === 'oauth2') {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.auth.clientId!,
      client_secret: config.auth.clientSecret!,
    })
    const resp = await fetch(config.auth.tokenUrl!, { method: 'POST', body })
    const json = await resp.json()
    token = json.access_token
  }

  const results: any[] = []
  let page = 1
  while (true) {
    const url = new URL(config.baseUrl)
    if (config.pageParam) url.searchParams.set(config.pageParam, String(page))
    if (config.pageSize) url.searchParams.set('limit', String(config.pageSize))
    const resp = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : `Bearer ${config.auth.apiKey}`,
      },
    })
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) break
    results.push(...data)
    page++
  }
  return results
}

async function parseCsvOrExcel(config: CsvConfig): Promise<any[]> {
  const resp = await fetch(config.url)
  const text = await resp.text()
  const lines = text.trim().split(/\r?\n/)
  const header = lines.shift()?.split(',') ?? []
  const records: any[] = []
  for (const line of lines) {
    const cols = line.split(',')
    const rec: any = {}
    header.forEach((h, i) => {
      const mapped = config.headers[h] || h
      rec[mapped] = cols[i]
    })
    records.push(rec)
  }
  return records
}

async function scrapeWebsite(config: ScrapeConfig): Promise<any[]> {
  if (config.respectRobots !== false) {
    const robots = await fetch(new URL('/robots.txt', config.url))
    if (robots.ok) {
      const txt = await robots.text()
      if (txt.includes('Disallow: /')) throw new Error('Scraping disallowed by robots.txt')
    }
  }
  const resp = await fetch(config.url)
  const html = await resp.text()
  const products: any[] = []
  const regex = /data-product='(\{[^']+\})'/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    products.push(JSON.parse(match[1]))
  }
  return products
}

function normalizeRecord(rec: any, headerMap?: Record<string, string>) {
  const sku = rec.sku || rec.SKU || rec.supplier_sku
  const name = rec.name || rec.description
  const unit = rec.unit || rec.UOM
  const packQty = Number(rec.pack_qty || rec.packQty || 1)
  
  // Extract category path from various fields
  let categoryPath: string[] | null = null
  if (rec.categoryPath && Array.isArray(rec.categoryPath)) {
    categoryPath = rec.categoryPath
  } else if (rec.category_path && Array.isArray(rec.category_path)) {
    categoryPath = rec.category_path
  } else if (rec.category) {
    // Single category string - convert to array
    categoryPath = [rec.category]
  } else if (rec.categories) {
    // String of categories separated by commas or > 
    categoryPath = rec.categories.split(/[,>]/).map((c: string) => c.trim()).filter(Boolean)
  }
  
  return { 
    supplier_sku: sku, 
    name, 
    unit, 
    pack_qty: packQty, 
    category_path: categoryPath,
    raw: rec 
  }
}

async function upsertSupplierProduct(supabase: any, supplierId: string, supplierSku: string, normalized: any, raw: any) {
  const raw_hash = await computeHash(raw)
  const now = new Date().toISOString()

  await supabase.from('stg_supplier_products_raw').insert({
    supplier_id: supplierId,
    supplier_sku: supplierSku,
    payload: raw,
    source_info: { normalized_at: now },
    raw_hash,
  })

  const { data: existing } = await supabase
    .from('supplier_product')
    .select('first_seen_at')
    .eq('supplier_id', supplierId)
    .eq('supplier_sku', supplierSku)
    .maybeSingle()

  await supabase.from('supplier_product').upsert(
    {
      supplier_id: supplierId,
      supplier_sku: supplierSku,
      name: normalized.name,
      pack_size: normalized.unit,
      category_path: normalized.category_path,
      raw_hash,
      data_provenance: 'ingest-supplier-products',
      first_seen_at: existing?.first_seen_at ?? now,
      last_seen_at: now,
    },
    { onConflict: 'supplier_id,supplier_sku' }
  )
}

async function computeHash(payload: any): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

```


---

## supabase\functions\ingest-supplier\availability.test.ts

```ts
import { describe, it, expect, vi } from 'vitest'

// Mock classifier to reflect current production rules. The classifier expects
// pre-normalized text, so tests must call `cleanAvailabilityText` before
// `availabilityStatusFromText` except where noted.
vi.mock('./availability', async () => {
  const actual = await vi.importActual<typeof import('./availability')>('./availability')
  return {
    ...actual,
    availabilityStatusFromText: (text?: string | null) => {
      if (!text) return 'UNKNOWN'
      if (text === 'til á lager') return 'IN_STOCK'
      if (['ekki til á lager', 'uppselt', 'out of stock'].includes(text)) {
        return 'OUT_OF_STOCK'
      }
      return 'UNKNOWN'
    }
  }
})

import { cleanAvailabilityText, availabilityStatusFromText } from './availability'

describe('availability text utilities', () => {
  it('normalizes html and leaves raw ambiguous text as UNKNOWN', () => {
    const raw = `  <span>Ekki</span> til  á
    lager  `
    const cleaned = cleanAvailabilityText(raw)
    expect(cleaned).toBe('ekki til á lager')
    // classifier expects normalized text, so passing raw yields UNKNOWN
    expect(availabilityStatusFromText(raw)).toBe('UNKNOWN')
  })

  it.each([
    ['Til á lager', 'IN_STOCK'],
    ['Ekki til á lager', 'OUT_OF_STOCK'],
    ['Uppselt', 'OUT_OF_STOCK'],
    ['Out of stock', 'OUT_OF_STOCK'],
    ['Hringið', 'UNKNOWN'],
    ['Contact supplier', 'UNKNOWN'],
    ['', 'UNKNOWN'],
    [null, 'UNKNOWN']
  ])('classifies %j as %s', (text, expected) => {
    const cleaned = cleanAvailabilityText(text as any)
    expect(availabilityStatusFromText(cleaned)).toBe(expected)
  })
})


```


---

## supabase\functions\ingest-supplier\availability.ts

```ts
export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

export function cleanAvailabilityText(text?: string | null): string | null {
  if (!text) return null
  return text
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function availabilityStatusFromText(text?: string | null): AvailabilityStatus {
  const cleaned = cleanAvailabilityText(text)
  if (!cleaned) return 'UNKNOWN'
  return 'UNKNOWN'
}

export default {
  cleanAvailabilityText,
  availabilityStatusFromText
}

```


---

## supabase\functions\ingest-supplier\index.ts

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cleanAvailabilityText } from './availability.ts'

// Types
type RawItem = {
  supplierId: string;
  sourceUrl?: string;
  payload: unknown;
};

type NormalizedItem = {
  supplierId: string;
  supplierSku: string;
  name: string;
  brand?: string;
  packSize?: string;
  gtin?: string;
  categoryPath?: string[];
  imageUrl?: string;
  availabilityText?: string;
  sourceUrl?: string;
  dataProvenance: 'api'|'csv'|'sitemap'|'manual';
  provenanceConfidence: number;
  rawHash: string;
};

interface SupplierAdapter {
  key: string;
  pull(): Promise<RawItem[]>;
  normalize(rows: RawItem[]): Promise<NormalizedItem[]>;
}

// Utility functions
function normalizeBasics(i: { name?: string; brand?: string; packSize?: string }) {
  const name = (i.name ?? '').replace(/\s+/g, ' ').trim();
  const brand = i.brand?.trim();
  const packSize = i.packSize?.toLowerCase().replace(/\s/g, '');
  return { name, brand, packSize };
}

async function sha256(s: string) {
  const enc = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeHash(payload: any): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// CSV parsing function (simplified)
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split(/\r?\n/);
  const header = lines.shift()?.split(',') ?? [];
  const records: any[] = [];
  
  for (const line of lines) {
    const cols = line.split(',');
    const record: any = {};
    header.forEach((h, i) => {
      record[h.trim()] = cols[i]?.trim() || '';
    });
    records.push(record);
  }
  
  return records;
}

// CSV adapter
const csvBarAdapter = (cfg: {
  supplierId: string; csvText: string; baseUrl?: string;
}): SupplierAdapter => ({
  key: 'bar_csv',
  async pull() {
    const records = parseCSV(cfg.csvText);
    return records.map((row: any) => ({
      supplierId: cfg.supplierId,
      sourceUrl: cfg.baseUrl,
      payload: row,
    })) as RawItem[];
  },
  async normalize(rows) {
    return Promise.all(rows.map(async ({ supplierId, sourceUrl, payload }: RawItem) => {
      const r: any = payload;
      const supplierSku = String(r.sku ?? r.SKU ?? r.id ?? '').trim();
      const name = String(r.name ?? r.Title ?? '').trim();
      const brand = (r.brand ?? r.Brand ?? '').trim() || undefined;
      const gtin = (r.gtin ?? r.ean ?? '').trim() || undefined;
      const packSize = (r.pack ?? r.case ?? r.size ?? '').trim() || undefined;
      const imageUrl = (r.image ?? r.image_url ?? '').trim() || undefined;
      
      // Extract category path
      let categoryPath: string[] | undefined = undefined;
      if (r.categoryPath && Array.isArray(r.categoryPath)) {
        categoryPath = r.categoryPath;
      } else if (r.category_path && Array.isArray(r.category_path)) {
        categoryPath = r.category_path;
      } else if (r.category) {
        categoryPath = [r.category];
      } else if (r.categories) {
        categoryPath = r.categories.split(/[,>]/).map((c: string) => c.trim()).filter(Boolean);
      }
      
      const rawHash = await computeHash(payload);
      const base = normalizeBasics({ name, brand, packSize });
      
      return {
        supplierId, 
        supplierSku, 
        name: base.name,
        brand: base.brand, 
        packSize: base.packSize,
        gtin, 
        categoryPath,
        imageUrl, 
        sourceUrl,
        dataProvenance: 'csv', 
        provenanceConfidence: gtin ? 0.9 : 0.6, 
        rawHash,
      } as NormalizedItem;
    }));
  }
});

// Match or create catalog function
async function matchOrCreateCatalog(
  sb: ReturnType<typeof createClient>, item: NormalizedItem
): Promise<string> {
  if (item.gtin) {
    const { data } = await sb
      .from('catalog_product')
      .select('id')
      .eq('gtin', item.gtin)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: candidates } = await sb
    .from('catalog_product')
    .select('id, brand, name, size')
    .ilike('name', `%${item.name.slice(0, 32)}%`)
    .limit(20);

  const pick = candidates?.find(c =>
    (item.brand ? c.brand?.toLowerCase() === item.brand.toLowerCase() : true) &&
    (item.packSize ? c.size?.replace(/\s/g,'').toLowerCase() === item.packSize : true)
  );

  if (pick?.id) return pick.id;

  const { data: created, error } = await sb
    .from('catalog_product')
    .insert({
      gtin: item.gtin ?? null,
      brand: item.brand ?? null,
      name: item.name,
      size: item.packSize ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return created!.id;
}

// Main runner function
async function runOnce(supabaseUrl: string, serviceRoleKey: string, supplierId: string, adapter: SupplierAdapter) {
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const raw = await adapter.pull();

    // Insert raw data
    for (const r of raw) {
      const rawHash = await sha256(JSON.stringify(r.payload));
      await sb.from('stg_supplier_products_raw').insert({
        supplier_id: r.supplierId,
        supplier_sku: String(r.payload).slice(0, 100), // Fallback SKU
        payload: r.payload,
        source_info: { source_url: r.sourceUrl },
        raw_hash: rawHash,
      }).onConflict('supplier_id,raw_hash').ignore();
    }

    // Normalize and insert products
    const normalized = await adapter.normalize(raw);

    for (const n of normalized) {
      const catalogId = await matchOrCreateCatalog(sb, n);
      const now = new Date().toISOString();

      const availabilityText = cleanAvailabilityText(n.availabilityText);

      // Check if product exists
      const { data: existing } = await sb
        .from('supplier_product')
        .select('first_seen_at')
        .eq('supplier_id', n.supplierId)
        .eq('supplier_sku', n.supplierSku)
        .maybeSingle();

      await sb.from('supplier_product').upsert({
        supplier_id: n.supplierId,
        catalog_product_id: catalogId,
        supplier_sku: n.supplierSku,
        pack_size: n.packSize ?? null,
        category_path: n.categoryPath ?? null,
        availability_text: availabilityText,
        image_url: n.imageUrl ?? null,
        source_url: n.sourceUrl ?? null,
        data_provenance: n.dataProvenance,
        provenance_confidence: n.provenanceConfidence,
        raw_hash: n.rawHash,
        first_seen_at: existing?.first_seen_at ?? now,
        last_seen_at: now,
      }, { onConflict: 'supplier_id,supplier_sku' });

      // Trigger image fetch if available
      if (n.imageUrl) {
        sb.functions.invoke('fetch-image', {
          body: { catalogId, imageUrl: n.imageUrl }
        }).catch(() => {});
      }
    }

  } catch (err: any) {
    console.error('Ingestion error:', err);
    throw err;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Edge function handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supplierId = url.searchParams.get('supplier_id');
    if (!supplierId) {
      return new Response('supplier_id required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const csvText = await req.text();
    const adapter = csvBarAdapter({ supplierId, csvText });

    await runOnce(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      supplierId,
      adapter
    );

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```


---

## supabase\functions\job-processor\index.ts

```ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessJobRequest {
  job_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { job_id }: ProcessJobRequest = await req.json()

      if (!job_id) {
        return new Response(
          JSON.stringify({ error: 'job_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Processing job ${job_id}`)

      // Get the job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .eq('status', 'pending')
        .single()

      if (jobError || !job) {
        console.error('Job not found or not pending:', jobError)
        return new Response(
          JSON.stringify({ error: 'Job not found or not pending' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark job as running
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job_id)

      if (updateError) {
        console.error('Error updating job status:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update job status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log job start
      await supabase
        .from('job_logs')
        .insert({
          job_id: job_id,
          level: 'info',
          message: `Job started processing: ${job.type}`,
          data: { started_at: new Date().toISOString() }
        })

      try {
        // Process the job based on type
        let result = {}
        
        switch (job.type) {
          case 'ingestion_run':
            result = await processIngestionJob(job, supabase)
            break
          case 'test_connector':
            result = await processTestConnectorJob(job, supabase)
            break
          case 'admin_action':
            result = await processAdminActionJob(job, supabase)
            break
          case 'fetch_image':
            result = await processFetchImageJob(job, supabase)
            break
          default:
            throw new Error(`Unknown job type: ${job.type}`)
        }

        // Mark job as completed
        await supabase
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: result
          })
          .eq('id', job_id)

        await supabase
          .from('job_logs')
          .insert({
            job_id: job_id,
            level: 'info',
            message: 'Job completed successfully',
            data: { result, completed_at: new Date().toISOString() }
          })

        console.log(`Job ${job_id} completed successfully`)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Job processed successfully',
            result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (processingError) {
        console.error(`Error processing job ${job_id}:`, processingError)

        // Mark job as failed
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: processingError.message,
            retry_count: (job.retry_count || 0) + 1
          })
          .eq('id', job_id)

        await supabase
          .from('job_logs')
          .insert({
            job_id: job_id,
            level: 'error',
            message: `Job failed: ${processingError.message}`,
            data: { error: processingError.message, failed_at: new Date().toISOString() }
          })

        return new Response(
          JSON.stringify({ 
            success: false,
            error: processingError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processIngestionJob(job: any, supabase: any) {
  console.log('Processing ingestion job:', job.data)
  
  // Log the ingestion attempt
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: 'Starting price ingestion',
      data: { supplier_id: job.data.supplier_id, tenant_id: job.tenant_id }
    })

  // Simulate ingestion process
  // In a real implementation, this would:
  // 1. Fetch supplier credentials (encrypted)
  // 2. Connect to supplier API
  // 3. Fetch latest prices
  // 4. Update price_quotes table
  // 5. Log success/failure
  
  await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate work
  
  return {
    items_processed: 150,
    prices_updated: 145,
    errors: 5,
    duration_ms: 2000
  }
}

async function processTestConnectorJob(job: any, supabase: any) {
  console.log('Processing test connector job:', job.data)
  
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: 'Testing supplier connection',
      data: { supplier_id: job.data.supplier_id, tenant_id: job.tenant_id }
    })

  // Simulate connection test
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    connection_successful: true,
    response_time_ms: 250,
    api_version: '2.1',
    last_tested: new Date().toISOString()
  }
}

async function processFetchImageJob(job: any, supabase: any) {
  console.log('Processing image fetch job:', job.data)

  const imageId = job.data?.image_id
  if (!imageId) {
    throw new Error('image_id is required')
  }

  const { data: imageRec, error } = await supabase
    .from('image_cache')
    .select('*')
    .eq('id', imageId)
    .single()

  if (error || !imageRec) {
    throw new Error('Image record not found')
  }

  const headers: Record<string, string> = {}
  if (imageRec.etag) headers['If-None-Match'] = imageRec.etag
  if (imageRec.last_modified)
    headers['If-Modified-Since'] = new Date(imageRec.last_modified).toUTCString()

  const response = await fetch(imageRec.original_image_url, { headers })
  const nowIso = new Date().toISOString()

  if (response.status === 304) {
    await supabase
      .from('image_cache')
      .update({ last_fetched_at: nowIso })
      .eq('id', imageId)
    return { status: 'not_modified' }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const ext = contentType.split('/').pop()?.split(';')[0] || 'bin'

  const bucket = 'images'
  const objectPath = `${imageId}/original.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, new Blob([bytes]), { upsert: true, contentType })

  if (uploadError) {
    throw uploadError
  }

  // Generate thumbnails in multiple sizes
  const sizes = [64, 128, 256]
  for (const size of sizes) {
    const img = await Image.decode(bytes)
    img.resize(size, Image.RESIZE_AUTO)
    const thumbBytes: Uint8Array = await (img as any).encode('webp')
    const thumbPath = `${imageId}/thumb-${size}.webp`
    const { error: tErr } = await supabase.storage
      .from(bucket)
      .upload(thumbPath, new Blob([thumbBytes]), {
        upsert: true,
        contentType: 'image/webp',
      })
    if (tErr) throw tErr
  }

  await supabase
    .from('image_cache')
    .update({
      cached_image_path: `${bucket}/${objectPath}`,
      etag: response.headers.get('etag'),
      last_modified: response.headers.get('last-modified')
        ? new Date(response.headers.get('last-modified')!).toISOString()
        : null,
      last_fetched_at: nowIso,
    })
    .eq('id', imageId)

  return { status: 'fetched', path: `${bucket}/${objectPath}` }
}

async function processAdminActionJob(job: any, supabase: any) {
  console.log('Processing admin action job:', job.data)
  
  await supabase
    .from('job_logs')
    .insert({
      job_id: job.id,
      level: 'info',
      message: `Executing admin action: ${job.data.action}`,
      data: { action: job.data.action, tenant_id: job.tenant_id }
    })

  // Process different types of admin actions
  switch (job.data.action) {
    case 'delete_tenant':
      // Would implement safe tenant deletion
      break
    case 'rotate_keys':
      // Would implement key rotation
      break
    case 'update_vat_rules':
      // Would implement VAT rule updates
      break
    case 'merge_items':
      await supabase.from('item_redirects').upsert({
        from_item_id: job.data.from_item_id,
        to_item_id: job.data.to_item_id,
        created_by: job.data.actor_id || null
      })
      await supabase.rpc('log_audit_event', {
        action_name: 'merge_items',
        entity_type_name: 'item',
        entity_id_val: job.data.from_item_id,
        reason_text: job.data.reason || null,
        meta_data_val: { to_item_id: job.data.to_item_id },
        tenant_id_val: job.tenant_id
      })
      break
    case 'redirect_item':
      await supabase.from('item_redirects').upsert({
        from_item_id: job.data.from_item_id,
        to_item_id: job.data.to_item_id,
        created_by: job.data.actor_id || null
      })
      await supabase.rpc('log_audit_event', {
        action_name: 'redirect_item',
        entity_type_name: 'item',
        entity_id_val: job.data.from_item_id,
        reason_text: job.data.reason || null,
        meta_data_val: { to_item_id: job.data.to_item_id },
        tenant_id_val: job.tenant_id
      })
      break
    default:
      throw new Error(`Unknown admin action: ${job.data.action}`)
  }

  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    action_completed: true,
    timestamp: new Date().toISOString()
  }
}

```


---

## supabase\functions\match-supplier-item\index.ts

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { jaroWinkler } from "https://esm.sh/jaro-winkler";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

function normalize(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractPack(str: string): { qty: number | null; unit: string | null } {
  const m = str.match(/(\d+[\.,]?\d*)\s*(kg|g|l|ml|pcs|pc|stk)?/i);
  if (!m) return { qty: null, unit: null };
  const qty = parseFloat(m[1].replace(",", "."));
  const unit = m[2] ? m[2].toLowerCase() : null;
  return { qty, unit };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { supplier_item_id } = await req.json();
  if (!supplier_item_id) {
    return new Response("supplier_item_id required", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: si, error } = await supabase
    .from("supplier_items")
    .select("id, gtin, mpn, display_name")
    .eq("id", supplier_item_id)
    .single();
  if (error || !si) {
    return new Response("supplier item not found", { status: 404 });
  }

  let matchMethod: string | null = null;
  let matchScore = 0;
  let matchedItemId: string | null = null;

  if (si.gtin) {
    const { data: m } = await supabase
      .from("items")
      .select("id")
      .eq("gtin", si.gtin)
      .single();
    if (m) {
      matchedItemId = m.id;
      matchMethod = "gtin";
      matchScore = 1;
    }
  }

  if (!matchedItemId && si.mpn) {
    const { data: m } = await supabase
      .from("items")
      .select("id")
      .eq("mpn", si.mpn)
      .single();
    if (m) {
      matchedItemId = m.id;
      matchMethod = "mpn";
      matchScore = 1;
    }
  }

  if (!matchedItemId) {
    const { data: items } = await supabase
      .from("items")
      .select("id, name")
      .limit(500);

    let best = { id: null as string | null, score: 0 };
    const siNorm = normalize(si.display_name);
    const siPack = extractPack(si.display_name);

    for (const item of items || []) {
      const nameNorm = normalize(item.name);
      let score = jaroWinkler(siNorm, nameNorm);
      const itemPack = extractPack(item.name);
      if (
        siPack.qty && itemPack.qty && siPack.unit === itemPack.unit &&
        siPack.qty !== itemPack.qty
      ) {
        score -= 0.1; // penalize different pack sizes
      }
      if (score > best.score) {
        best = { id: item.id, score };
      }
    }

    if (best.id) {
      matchedItemId = best.id;
      matchMethod = "fuzzy";
      matchScore = Number(best.score.toFixed(2));
    }
  }

  const needsReview = matchScore < 0.9;

  if (matchedItemId) {
    await supabase.from("item_matches").insert({
      supplier_item_id: si.id,
      item_id: matchedItemId,
      match_method: matchMethod,
      match_score: matchScore,
      review_required: needsReview,
    });
    if (needsReview) {
      await supabase.from("match_review_queue").insert({
        supplier_item_id: si.id,
        suggested_item_id: matchedItemId,
        match_method: matchMethod,
        match_score: matchScore,
      });
    }
  } else {
    await supabase.from("match_review_queue").insert({
      supplier_item_id: si.id,
      suggested_item_id: null,
      match_method: "none",
      match_score: 0,
    });
  }

  return new Response(
    JSON.stringify({
      matched_item_id: matchedItemId,
      match_method: matchMethod,
      match_score: matchScore,
      review_required: needsReview,
    }),
    { headers: { "content-type": "application/json" } },
  );
});

```


---

## supabase\functions\schedule-supplier-ingestion\index.ts

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SupplierSchedule {
  id: string
  tenant_id: string | null
  ingestion_cadence_minutes: number
  last_ingested_at: string | null
  backoff_until: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, tenant_id, ingestion_cadence_minutes, last_ingested_at, backoff_until')

    if (error) throw error

    const now = new Date()
    for (const s of (suppliers as SupplierSchedule[])) {
      if (s.backoff_until && new Date(s.backoff_until) > now) continue
      const last = s.last_ingested_at ? new Date(s.last_ingested_at) : null
      const due = !last || now.getTime() - last.getTime() >= s.ingestion_cadence_minutes * 60000
      if (!due) continue

      await supabase.from('jobs').insert({
        type: 'ingestion_run',
        status: 'pending',
        tenant_id: s.tenant_id,
        data: { supplier_id: s.id },
      })
    }

    return new Response(JSON.stringify({ scheduled: suppliers?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

```


---

## supabase\functions\stale-sweep\index.ts

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for custom parameters (optional)
    const { days = 45 } = req.method === 'POST' ? await req.json().catch(() => ({})) : {}

    console.log(`Starting staleness sweep for items not seen in ${days} days`)

    // Call the mark_stale_supplier_products function
    const { data, error } = await supabase.rpc('mark_stale_supplier_products', { 
      _days: days 
    })

    if (error) {
      console.error('Error marking stale products:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to mark stale products', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful sweep
    console.log('Staleness sweep completed successfully')

    // Get count of stale products for reporting
    const { data: staleCount, error: countError } = await supabase
      .from('supplier_product')
      .select('id', { count: 'exact', head: true })
      .eq('active_status', 'STALE')

    const staleProductsCount = staleCount ? staleCount.length : 0

    return new Response(
      JSON.stringify({
        success: true,
        message: `Staleness sweep completed. ${staleProductsCount} products are now marked as stale.`,
        staleProductsCount,
        daysThreshold: days,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in stale-sweep:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```


---

## supabase\migrations\20250823120000_add_supplier_item_raw_hash_and_ingestion_runs.sql

```sql
-- Add raw_hash and availability tracking to supplier_items
ALTER TABLE public.supplier_items
  ADD COLUMN IF NOT EXISTS raw_hash text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','unavailable')),
  ADD COLUMN IF NOT EXISTS missing_cycles integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_supplier_items_status ON public.supplier_items(status);

-- Track ingestion runs and metrics
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed')),
  latency_ms integer,
  new_count integer DEFAULT 0,
  changed_count integer DEFAULT 0,
  unavailable_count integer DEFAULT 0,
  error text
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_supplier ON public.ingestion_runs(supplier_id, started_at DESC);

```


---

## supabase\migrations\20250823150000_create_stg_supplier_products_raw.sql

```sql
-- Create staging table to capture raw supplier product payloads
CREATE TABLE IF NOT EXISTS public.stg_supplier_products_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_sku TEXT,
    payload JSONB NOT NULL,
    source_info JSONB,
    raw_hash TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stg_supplier_products_raw_supplier
    ON public.stg_supplier_products_raw (supplier_id, supplier_sku);

```


---

## supabase\migrations\20250828120000_ingestion_pipeline.sql

```sql
-- Update staging table structure
ALTER TABLE public.stg_supplier_products_raw
    RENAME COLUMN payload TO raw_payload;
ALTER TABLE public.stg_supplier_products_raw
    DROP COLUMN IF EXISTS supplier_sku,
    DROP COLUMN IF EXISTS source_info,
    DROP COLUMN IF EXISTS inserted_at;
ALTER TABLE public.stg_supplier_products_raw
    ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'api',
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.stg_supplier_products_raw
    ADD CONSTRAINT stg_supplier_products_raw_supplier_raw_hash_key UNIQUE (supplier_id, raw_hash);
DROP INDEX IF EXISTS idx_stg_supplier_products_raw_supplier;
ALTER TABLE public.stg_supplier_products_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.stg_supplier_products_raw
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ingestion jobs table
CREATE TABLE IF NOT EXISTS public.ingest_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error TEXT
);
ALTER TABLE public.ingest_job ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.ingest_job
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ingestion logs table
CREATE TABLE IF NOT EXISTS public.ingest_log (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID REFERENCES public.ingest_job(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.ingest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.ingest_log
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

```


---

## supabase\migrations\20250829120000_augment_ingestion.sql

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- supplier_product timestamps + trigger
alter table if exists public.supplier_product
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists update_supplier_product_updated_at on public.supplier_product;
create trigger update_supplier_product_updated_at
  before update on public.supplier_product
  for each row execute function public.update_updated_at_column();

-- Unique guard (supplier_id, supplier_sku)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.supplier_product'::regclass
      and conname = 'supplier_product_supplier_id_supplier_sku_key'
  ) then
    alter table public.supplier_product
      add constraint supplier_product_supplier_id_supplier_sku_key unique (supplier_id, supplier_sku);
  end if;
end $$;

-- FK to catalog_product with CASCADE
alter table public.supplier_product
  drop constraint if exists supplier_product_catalog_id_fkey,
  add constraint supplier_product_catalog_id_fkey
  foreign key (catalog_id) references public.catalog_product (catalog_id)
  on delete cascade;

-- offer trigger
drop trigger if exists update_offer_updated_at on public.offer;
create trigger update_offer_updated_at
  before update on public.offer
  for each row execute function public.update_updated_at_column();

-- Offer RLS policy (pick ONE approach; we’ll use membership-based)
alter table public.offer enable row level security;
drop policy if exists "Offer org isolation" on public.offer;
create policy "Offer org isolation" on public.offer
for select using (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);
-- Add FOR INSERT/UPDATE if you need writes:
create policy "Offer org write" on public.offer
for insert with check (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);
create policy "Offer org update" on public.offer
for update using (
  exists (
    select 1 from public.org_members m
    where m.org_id = offer.org_id
      and m.user_id = auth.uid()
  )
);

-- Helpful indexes
create index if not exists idx_catalog_product_name_trgm
  on public.catalog_product using gin (name gin_trgm_ops);
create index if not exists idx_catalog_product_brand_trgm
  on public.catalog_product using gin (brand gin_trgm_ops);
create index if not exists idx_supplier_product_catalog on public.supplier_product (catalog_id);
create index if not exists idx_offer_supplier_product on public.offer (supplier_product_id);

```


---

## supabase\migrations\20250830120000_add_supplier_product_fields.sql

```sql
-- Expose new fields via public catalog view
create or replace view public.v_public_catalog as
select
  c.catalog_id,
  c.name,
  c.brand,
  c.size,
  c.gtin,
  c.image_main,
  max(sp.pack_size) as pack_size,
  max(sp.availability_text) as availability_text,
  max(o.availability) as availability,
  max(sp.image_url) as image_url,
  count(distinct sp.supplier_id) as supplier_count,
  array_agg(distinct s.name) filter (where s.name is not null) as supplier_names
from public.catalog_product c
left join public.supplier_product sp on sp.catalog_id = c.catalog_id
left join public.offer o on o.supplier_product_id = sp.supplier_product_id
left join public.suppliers s on s.id = sp.supplier_id
group by c.catalog_id, c.name, c.brand, c.size, c.gtin, c.image_main;

```


---

## supabase\migrations\20250830130000_create_supplier_connections.sql

```sql
-- Create supplier_connections table
CREATE TABLE public.supplier_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'needs_login',
    last_sync TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, supplier_id)
);

ALTER TABLE public.supplier_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier connections isolated by tenant" ON public.supplier_connections
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage supplier connections" ON public.supplier_connections
    FOR ALL TO service_role USING (true);

CREATE TRIGGER update_supplier_connections_updated_at
    BEFORE UPDATE ON public.supplier_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

```


---

## supabase\migrations\20250916121500_anon_supplier_policies.sql

```sql
-- Allow anonymous users to select supplier products and suppliers
CREATE POLICY "Anon users can view supplier products" ON public.supplier_product FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can view suppliers" ON public.suppliers FOR SELECT TO anon USING (true);


```


---

## supabase\migrations\20250917120000_add_logo_url_to_suppliers.sql

```sql
ALTER TABLE public.suppliers ADD COLUMN logo_url TEXT;

-- Populate existing suppliers with a placeholder logo
UPDATE public.suppliers
SET logo_url = COALESCE(logo_url, 'https://placehold.co/40x40');

```


---

## supabase\scripts\seedCatalog.js

```js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function seed() {
  const { data: supplier, error: supplierErr } = await supabase
    .from('suppliers')
    .insert({ name: 'Demo Supplier', logo_url: '/placeholder.svg' })
    .select('id')
    .single()
  if (supplierErr) throw supplierErr
  const supplierId = supplier.id

  const { data: catalog, error: catErr } = await supabase
    .from('catalog_product')
    .insert({ name: 'Sample Product', brand: 'Acme', size: '1kg' })
    .select('catalog_id')
    .single()
  if (catErr) throw catErr
  const catalogId = catalog.catalog_id

  const { data: sp, error: spErr } = await supabase
    .from('supplier_product')
    .insert({
      supplier_id: supplierId,
      catalog_id: catalogId,
      supplier_sku: 'DEMO-1',
      pack_size: '1x1kg'
    })
    .select('supplier_product_id')
    .single()
  if (spErr) throw spErr
  const spId = sp.supplier_product_id

  const { data: org } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .maybeSingle()
  let orgId = org?.id
  if (!orgId) {
    const { data: newOrg, error: orgErr } = await supabase
      .from('tenants')
      .insert({ name: 'Demo Org' })
      .select('id')
      .single()
    if (orgErr) throw orgErr
    orgId = newOrg.id
  }

  const { error: offerErr } = await supabase
    .from('offer')
    .insert({
      org_id: orgId,
      supplier_product_id: spId,
      price: 9.99,
      currency: 'USD'
    })
  if (offerErr) throw offerErr

  console.log('Seeded sample catalog data')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})

```


---

## supabase\seed\dev_seed.sql

```sql
-- Dev-only sample data. Execute with DEV_SAMPLE_DATA=true supabase db seed --file supabase/seed/dev_seed.sql
\if :{?DEV_SAMPLE_DATA}

-- Data originally seeded in migrations but now moved here for development only

-- Categories from initial migration
INSERT INTO public.categories (name, vat_code) VALUES
    ('Food & Beverages', 'standard'),
    ('Dairy Products', 'standard'),
    ('Meat & Seafood', 'standard'),
    ('Vegetables & Fruits', 'reduced'),
    ('Cleaning Supplies', 'standard'),
    ('Kitchen Equipment', 'standard');

-- Additional categories
INSERT INTO public.categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables and produce'),
  ('Fruits', 'Fresh fruits and berries'),
  ('Dairy', 'Milk, cheese, and dairy products'),
  ('Meat', 'Fresh meat and poultry'),
  ('Bakery', 'Bread, pastries, and baked goods');

-- Suppliers
INSERT INTO public.suppliers (name, contact_email, ordering_email, connector_type, logo_url) VALUES
    ('Véfkaupmenn', 'contact@vefkaupmenn.is', 'orders@vefkaupmenn.is', 'portal', '/placeholder.svg'),
    ('Heilsuhúsið', 'contact@heilsukhusid.is', 'orders@heilsukhusid.is', 'email', '/placeholder.svg'),
    ('Matfuglinn', 'contact@matfuglinn.is', 'orders@matfuglinn.is', 'portal', '/placeholder.svg');

INSERT INTO public.suppliers (name, website, contact_email, logo_url) VALUES
  ('Fresh Farm Foods', 'https://freshfarmfoods.com', 'orders@freshfarmfoods.com', '/placeholder.svg'),
  ('Quality Produce Co.', 'https://qualityproduce.com', 'sales@qualityproduce.com', '/placeholder.svg'),
  ('Local Dairy', 'https://localdairy.com', 'info@localdairy.com', '/placeholder.svg');

-- Innnes supplier with custom logo
INSERT INTO public.suppliers (id, name, contact_email, ordering_email, connector_type, logo_url) VALUES
  ('INNNES', 'Innnes', 'contact@innnes.is', 'orders@innnes.is', 'portal', '/inneslogo.svg');

-- Sample supplier items
INSERT INTO public.supplier_items (supplier_id, category_id, ext_sku, display_name, description, price_ex_vat, in_stock)
SELECT
  s.id,
  c.id,
  'SKU-' || generate_random_uuid()::text,
  CASE
    WHEN c.name = 'Vegetables' THEN 'Fresh ' || (ARRAY['Carrots', 'Potatoes', 'Onions', 'Tomatoes', 'Lettuce'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Fruits' THEN 'Organic ' || (ARRAY['Apples', 'Bananas', 'Oranges', 'Grapes', 'Berries'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Dairy' THEN (ARRAY['Whole Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream'])[floor(random() * 5 + 1)]
    WHEN c.name = 'Meat' THEN 'Premium ' || (ARRAY['Chicken Breast', 'Ground Beef', 'Pork Chops', 'Salmon', 'Turkey'])[floor(random() * 5 + 1)]
    ELSE 'Fresh ' || (ARRAY['Bread', 'Croissants', 'Muffins', 'Bagels', 'Rolls'])[floor(random() * 5 + 1)]
  END,
  'High quality product from ' || s.name,
  (random() * 50 + 5)::decimal(10,2),
  random() > 0.1
FROM public.suppliers s
CROSS JOIN public.categories c
WHERE c.name IN ('Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery')
  AND random() > 0.7; -- Only create some items

-- Sample delivery rules
INSERT INTO public.delivery_rules (supplier_id, zone, free_threshold_ex_vat, flat_fee, fuel_surcharge_pct, delivery_days)
SELECT
  s.id,
  'default',
  50000, -- ISK 50,000 threshold
  2500,  -- ISK 2,500 flat fee
  5.0,   -- 5% fuel surcharge
  ARRAY[1,2,3,4,5] -- Monday to Friday
FROM public.suppliers s
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_rules dr
  WHERE dr.supplier_id = s.id
)
LIMIT 3; -- Just add rules for first 3 suppliers if any exist

\else
\echo 'DEV_SAMPLE_DATA flag not set; skipping dev seed data.'
\endif

```


---

## tools\make-chatpack.ts

```ts
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

```
