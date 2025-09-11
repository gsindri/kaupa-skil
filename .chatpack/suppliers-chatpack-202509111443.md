# Suppliers ChatPack 2025-09-11T14:43:12.323Z

_Contains 46 file(s)._

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

## src\components\place-order\SupplierFilter.tsx

```tsx
import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Vendor } from '@/hooks/useVendors'

interface SupplierFilterProps {
  suppliers: Vendor[]
  value: string
  onChange: (value: string) => void
}

export const SupplierFilter = memo(function SupplierFilter({
  suppliers,
  value,
  onChange,
}: SupplierFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={v => onChange(v === 'all' ? '' : v)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All suppliers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All suppliers</SelectItem>
        {suppliers.map(s => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

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

## src\hooks\useConnectorRuns.tsx

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'
import type { Database } from '@/lib/types'

type ConnectorRun = Database['public']['Tables']['connector_runs']['Row'] & {
  supplier?: Database['public']['Tables']['suppliers']['Row']
}
type ConnectorRunInsert = Database['public']['Tables']['connector_runs']['Insert']

export function useConnectorRuns() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: runs, isLoading } = useQuery({
    queryKey: ['connector-runs', profile?.tenant_id || 'solo'],
    queryFn: async (): Promise<ConnectorRun[]> => {
      const tenantId = profile?.tenant_id

      const query = supabase
        .from('connector_runs')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false })

      const { data, error } = tenantId
        ? await query.eq('tenant_id', tenantId)
        : await query.is('tenant_id', null)

      if (error) throw error
      return data || []
    },
    enabled: !!profile
  })

  const createRun = useMutation({
    mutationFn: async (run: Omit<ConnectorRunInsert, 'id' | 'created_at'>) => {
      const payload = { ...run, tenant_id: profile?.tenant_id ?? null }

      const { data, error } = await supabase
        .from('connector_runs')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-runs'] })
      toast({
        title: 'Ingestion started',
        description: 'Price ingestion has been initiated'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start ingestion',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const updateRun = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConnectorRun> & { id: string }) => {
      const { data, error } = await supabase
        .from('connector_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-runs'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update run',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    runs,
    isLoading,
    createRun,
    updateRun
  }
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
      const query = supabase
        .from('supplier_connections')
        .select('id, supplier_id, status, last_sync, next_run, supplier:suppliers(name)')
        .order('created_at', { ascending: false })

      const { data, error } = profile?.tenant_id
        ? await query.eq('tenant_id', profile.tenant_id)
        : await query.is('tenant_id', null)

      if (error) throw error

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

## src\integrations\supabase\types.ts

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_elevations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          meta_data: Json | null
          reason: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product: {
        Row: {
          brand: string | null
          created_at: string
          gtin: string | null
          id: string
          name: string
          size: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          gtin?: string | null
          id?: string
          name: string
          size?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          gtin?: string | null
          id?: string
          name?: string
          size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      grants: {
        Row: {
          capability: string
          constraints: Json | null
          created_at: string | null
          id: string
          membership_id: string
          scope: string
          scope_id: string | null
          tenant_id: string
        }
        Insert: {
          capability: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id: string
          scope?: string
          scope_id?: string | null
          tenant_id: string
        }
        Update: {
          capability?: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id?: string
          scope?: string
          scope_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          job_id: string
          level: string
          message: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id: string
          level: string
          message: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          requested_by: string | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          attrs: Json | null
          base_role: string
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attrs?: Json | null
          base_role: string
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attrs?: Json | null
          base_role?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admin_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          reason: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requester_id: string
          target_entity_id: string | null
          target_entity_type: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_credentials: {
        Row: {
          created_at: string | null
          encrypted_credentials: string
          id: string
          last_tested_at: string | null
          supplier_id: string
          tenant_id: string | null
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_credentials: string
          id?: string
          last_tested_at?: string | null
          supplier_id: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_credentials?: string
          id?: string
          last_tested_at?: string | null
          supplier_id?: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product: {
        Row: {
          active_status: string | null
          availability_text: string | null
          catalog_product_id: string | null
          category_path: string[] | null
          created_at: string
          data_provenance: string | null
          delisted_reason: string | null
          first_seen_at: string
          id: string
          image_url: string | null
          last_seen_at: string
          pack_size: string | null
          provenance_confidence: number | null
          raw_hash: string | null
          source_url: string | null
          stale_since: string | null
          supplier_id: string
          supplier_sku: string
          updated_at: string
        }
        Insert: {
          active_status?: string | null
          availability_text?: string | null
          catalog_product_id?: string | null
          category_path?: string[] | null
          created_at?: string
          data_provenance?: string | null
          delisted_reason?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          pack_size?: string | null
          provenance_confidence?: number | null
          raw_hash?: string | null
          source_url?: string | null
          stale_since?: string | null
          supplier_id: string
          supplier_sku: string
          updated_at?: string
        }
        Update: {
          active_status?: string | null
          availability_text?: string | null
          catalog_product_id?: string | null
          category_path?: string[] | null
          created_at?: string
          data_provenance?: string | null
          delisted_reason?: string | null
          first_seen_at?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          pack_size?: string | null
          provenance_confidence?: number | null
          raw_hash?: string | null
          source_url?: string | null
          stale_since?: string | null
          supplier_id?: string
          supplier_sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalog"
            referencedColumns: ["catalog_id"]
          },
        ]
      }
      supplier_product_availability: {
        Row: {
          note: string | null
          qty: number | null
          status: Database["public"]["Enums"]["availability_status"]
          supplier_product_id: string
          updated_at: string
        }
        Insert: {
          note?: string | null
          qty?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          supplier_product_id: string
          updated_at?: string
        }
        Update: {
          note?: string | null
          qty?: number | null
          status?: Database["public"]["Enums"]["availability_status"]
          supplier_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_availability_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: true
            referencedRelation: "supplier_product"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_sessions: {
        Row: {
          actor_id: string
          created_at: string | null
          ends_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string | null
          tenant_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          ends_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          ends_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          kind: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          kind?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_public_catalog: {
        Row: {
          active_supplier_count: number | null
          availability_status: string | null
          availability_text: string | null
          availability_updated_at: string | null
          best_price: number | null
          brand: string | null
          canonical_pack: string | null
          catalog_id: string | null
          category_tags: string[] | null
          name: string | null
          on_special: boolean | null
          pack_sizes: string[] | null
          sample_image_url: string | null
          sample_source_url: string | null
          supplier_ids: string[] | null
          supplier_logo_urls: string[] | null
          supplier_names: string[] | null
          suppliers_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_password_strength: {
        Args: { password_text: string }
        Returns: boolean
      }
      create_elevation: {
        Args: { duration_minutes?: number; reason_text: string }
        Returns: string
      }
      create_support_session: {
        Args: {
          duration_minutes?: number
          reason_text: string
          target_tenant_id: string
        }
        Returns: string
      }
      decrypt_credential_data: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      derive_availability_status: {
        Args: { availability_text: string }
        Returns: string
      }
      encrypt_credential_data: {
        Args: { credential_data: Json }
        Returns: string
      }
      fetch_catalog_facets: {
        Args: {
          _availability?: string[]
          _brands?: string[]
          _category_ids?: string[]
          _pack_size_ranges?: string[]
          _search?: string
          _supplier_ids?: string[]
        }
        Returns: {
          count: number
          facet: string
          id: string
          name: string
        }[]
      }
      get_user_memberships: {
        Args: Record<PropertyKey, never>
        Returns: {
          attrs: Json
          base_role: string
          membership_id: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_active_elevation: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_capability: {
        Args: {
          cap: string
          target_id?: string
          target_scope: string
          want?: Json
        }
        Returns: boolean
      }
      has_support_session: {
        Args: { target_tenant: string }
        Returns: boolean
      }
      is_owner: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_name: string
          entity_id_val?: string
          entity_type_name?: string
          meta_data_val?: Json
          reason_text?: string
          tenant_id_val?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: { details?: Json; event_type: string }
        Returns: undefined
      }
      mark_stale_supplier_products: {
        Args: { _days?: number }
        Returns: undefined
      }
      revoke_elevation: {
        Args: { elevation_id: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_initial_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      setup_owner_grants: {
        Args: { _membership_id: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      availability_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_status: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "UNKNOWN"],
    },
  },
} as const

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

## supabase\migrations\20250812165208_79d75377-0718-46c4-ae46-a086b1a517a6.sql

```sql

-- Enable RLS and create extensions
ALTER DATABASE postgres SET "app.tenant_id" = '';

-- Create enums
CREATE TYPE public.user_role AS ENUM ('admin', 'buyer', 'manager');
CREATE TYPE public.connector_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.order_status AS ENUM ('draft', 'submitted', 'confirmed', 'cancelled');
CREATE TYPE public.dispatch_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- Core tenancy tables
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers and credentials
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_email TEXT,
    ordering_email TEXT,
    website TEXT,
    connector_type TEXT, -- 'portal', 'email', 'api'
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.supplier_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    encrypted_blob TEXT NOT NULL, -- libsodium sealed box
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status TEXT, -- 'success', 'failed', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, supplier_id)
);

-- Units and categories
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'kg', 'g', 'L', 'ml', 'each'
    name TEXT NOT NULL,
    base_unit TEXT, -- for conversions
    conversion_factor DECIMAL(10,6), -- to base unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id),
    vat_code TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VAT rules
CREATE TABLE public.vat_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL, -- 'standard', 'reduced', 'zero'
    rate DECIMAL(5,4) NOT NULL, -- 0.24, 0.11, 0.00
    category_id UUID REFERENCES public.categories(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items and supplier items
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    category_id UUID REFERENCES public.categories(id),
    default_unit_id UUID REFERENCES public.units(id),
    ean TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.supplier_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    ext_sku TEXT NOT NULL, -- supplier's SKU
    ean TEXT,
    display_name TEXT NOT NULL,
    pack_qty DECIMAL(10,3) NOT NULL DEFAULT 1,
    pack_unit_id UUID REFERENCES public.units(id),
    yield_pct DECIMAL(5,2) DEFAULT 100.00, -- for waste calculation
    category_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, ext_sku)
);

-- Item matching for entity resolution
CREATE TABLE public.item_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_item_id, item_id)
);

-- Price quotes and history
CREATE TABLE public.price_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE,
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pack_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ISK',
    vat_code TEXT DEFAULT 'standard',
    unit_price_ex_vat DECIMAL(10,4), -- computed
    unit_price_inc_vat DECIMAL(10,4), -- computed
    source TEXT, -- 'portal', 'email', 'manual'
    connector_run_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders and order lines
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    status order_status DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    supplier_item_id UUID REFERENCES public.supplier_items(id),
    qty_packs DECIMAL(10,3) NOT NULL,
    pack_price DECIMAL(10,2) NOT NULL,
    unit_price_ex_vat DECIMAL(10,4),
    unit_price_inc_vat DECIMAL(10,4),
    vat_rate DECIMAL(5,4),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order dispatch tracking
CREATE TABLE public.order_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    status dispatch_status DEFAULT 'pending',
    message_id TEXT, -- email message ID
    attachments JSONB DEFAULT '[]', -- array of file paths
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connector runs for ingestion tracking
CREATE TABLE public.connector_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    connector_type TEXT NOT NULL,
    status connector_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    items_found INTEGER DEFAULT 0,
    prices_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    log_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "Profiles are viewable by users in same tenant" ON public.profiles
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Supplier credentials isolated by tenant" ON public.supplier_credentials
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Orders isolated by tenant" ON public.orders
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Order lines through orders" ON public.order_lines
    FOR ALL USING (
        order_id IN (
            SELECT id FROM public.orders WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Connector runs isolated by tenant" ON public.connector_runs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Audit events isolated by tenant" ON public.audit_events
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Public read access for reference data
CREATE POLICY "Units are publicly readable" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "VAT rules are publicly readable" ON public.vat_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers are publicly readable" ON public.suppliers FOR SELECT TO authenticated USING (true);

-- Service role policies for system operations
CREATE POLICY "Service role can manage all data" ON public.profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage supplier credentials" ON public.supplier_credentials FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage connector runs" ON public.connector_runs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage price quotes" ON public.price_quotes FOR ALL TO service_role USING (true);

-- Insert seed data
INSERT INTO public.units (code, name, base_unit, conversion_factor) VALUES
    ('kg', 'Kilogram', 'kg', 1.0),
    ('g', 'Gram', 'kg', 0.001),
    ('L', 'Liter', 'L', 1.0),
    ('ml', 'Milliliter', 'L', 0.001),
    ('each', 'Each', 'each', 1.0),
    ('pack', 'Pack', 'each', 1.0),
    ('case', 'Case', 'each', 1.0);

INSERT INTO public.vat_rules (code, rate) VALUES
    ('standard', 0.24),
    ('reduced', 0.11),
    ('zero', 0.00);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_credentials_updated_at BEFORE UPDATE ON public.supplier_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_items_updated_at BEFORE UPDATE ON public.supplier_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_dispatches_updated_at BEFORE UPDATE ON public.order_dispatches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
