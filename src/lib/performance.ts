
// Performance monitoring utilities

// Define memory info interface for browsers that support it
interface BrowserMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceMonitor {
  private static measurements = new Map<string, number>()
  private static isEnabled = process.env.NODE_ENV === 'development'

  static startMeasurement(name: string) {
    if (!this.isEnabled) return
    this.measurements.set(name, performance.now())
  }

  static endMeasurement(name: string): number {
    if (!this.isEnabled) return 0
    
    const startTime = this.measurements.get(name)
    if (!startTime) {
      console.warn(`No start measurement found for: ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.delete(name)
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasurement(name)
      
      try {
        const result = await fn()
        const duration = this.endMeasurement(name)
        
        if (this.isEnabled && duration > 0) {
          console.log(`${name} completed in ${duration.toFixed(2)}ms`)
        }
        
        resolve(result)
      } catch (error) {
        this.endMeasurement(name)
        reject(error)
      }
    })
  }

  static getMemoryUsage(): BrowserMemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory as BrowserMemoryInfo
    }
    return null
  }

  static logMemoryUsage() {
    if (!this.isEnabled) return

    const memory = this.getMemoryUsage()
    if (memory) {
      console.log('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }

  static getPerformanceMetrics() {
    const memory = this.getMemoryUsage()
    return {
      memory: memory ? {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing,
      navigation: performance.navigation
    }
  }

  static enable() {
    this.isEnabled = true
  }

  static disable() {
    this.isEnabled = false
  }
}

// Auto-log memory usage only in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    PerformanceMonitor.logMemoryUsage()
  }, 30000)
}
