
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalEntries: number
    validJsonResponses: number
    potentialProductApis: number
    estimatedItems: number
  }
}

export class HarValidator {
  private readonly MIN_ENTRIES = 5
  private readonly MIN_JSON_RESPONSES = 1
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  validate(harContent: string): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      stats: {
        totalEntries: 0,
        validJsonResponses: 0,
        potentialProductApis: 0,
        estimatedItems: 0
      }
    }

    try {
      // Check file size
      if (harContent.length > this.MAX_FILE_SIZE) {
        result.errors.push('HAR file is too large (max 50MB)')
        return result
      }

      // Parse JSON
      let har: any
      try {
        har = JSON.parse(harContent)
      } catch (parseError) {
        result.errors.push('Invalid JSON format')
        return result
      }

      // Validate HAR structure
      if (!har.log || !Array.isArray(har.log.entries)) {
        result.errors.push('Invalid HAR format: missing log.entries array')
        return result
      }

      const entries = har.log.entries
      result.stats.totalEntries = entries.length

      if (entries.length < this.MIN_ENTRIES) {
        result.warnings.push(`HAR file has only ${entries.length} entries (recommended: ${this.MIN_ENTRIES}+)`)
      }

      // Analyze entries
      let jsonResponses = 0
      let productApis = 0
      let estimatedItems = 0

      const productUrlPatterns = [
        /\/(api|graphql|products|catalog|prices|items|menu)/i,
        /product/i,
        /item/i,
        /catalog/i
      ]

      for (const entry of entries) {
        const url = entry?.request?.url || ''
        const mimeType = (entry?.response?.content?.mimeType || '').toLowerCase()
        const responseText = entry?.response?.content?.text

        // Count JSON responses
        if (mimeType.includes('application/json') && responseText) {
          jsonResponses++

          // Check if it looks like a product API
          const isProductApi = productUrlPatterns.some(pattern => pattern.test(url))
          if (isProductApi) {
            productApis++

            // Try to estimate item count
            try {
              const data = JSON.parse(responseText)
              const itemArrays = this.findArraysInObject(data)
              estimatedItems += itemArrays.reduce((sum, arr) => sum + arr.length, 0)
            } catch {
              // Ignore parse errors for estimation
            }
          }
        }
      }

      result.stats.validJsonResponses = jsonResponses
      result.stats.potentialProductApis = productApis
      result.stats.estimatedItems = estimatedItems

      // Validation checks
      if (jsonResponses < this.MIN_JSON_RESPONSES) {
        result.errors.push('No valid JSON responses found in HAR file')
      }

      if (productApis === 0) {
        result.warnings.push('No product/catalog API calls detected')
      }

      if (estimatedItems === 0) {
        result.warnings.push('No product arrays found in API responses')
      }

      // Check for common issues
      this.checkCommonIssues(har, result)

      result.isValid = result.errors.length === 0

      return result

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  private findArraysInObject(obj: any, maxDepth = 3): any[][] {
    const arrays: any[][] = []
    
    if (maxDepth <= 0) return arrays

    if (Array.isArray(obj) && obj.length > 0) {
      arrays.push(obj)
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        arrays.push(...this.findArraysInObject(value, maxDepth - 1))
      }
    }

    return arrays
  }

  private checkCommonIssues(har: any, result: ValidationResult): void {
    const entries = har.log.entries || []

    // Check for empty responses
    const emptyResponses = entries.filter((e: any) => 
      !e?.response?.content?.text || e.response.content.text.trim() === ''
    ).length

    if (emptyResponses > entries.length * 0.5) {
      result.warnings.push('Many responses appear to be empty')
    }

    // Check for error responses
    const errorResponses = entries.filter((e: any) => {
      const status = e?.response?.status || 0
      return status >= 400
    }).length

    if (errorResponses > entries.length * 0.3) {
      result.warnings.push('Many HTTP error responses detected')
    }

    // Check for CORS issues
    const corsErrors = entries.filter((e: any) => 
      e?.response?.status === 0 || 
      (e?.response?.content?.text || '').includes('CORS')
    ).length

    if (corsErrors > 0) {
      result.warnings.push('Possible CORS issues detected - some requests may have failed')
    }

    // Check timestamp range
    const timestamps = entries
      .map((e: any) => new Date(e?.startedDateTime).getTime())
      .filter((t: number) => !isNaN(t))
      .sort()

    if (timestamps.length > 0) {
      const duration = timestamps[timestamps.length - 1] - timestamps[0]
      const durationMinutes = duration / (1000 * 60)

      if (durationMinutes < 1) {
        result.warnings.push('HAR capture duration is very short (< 1 minute)')
      }
    }
  }
}
