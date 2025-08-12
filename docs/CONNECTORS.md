
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
