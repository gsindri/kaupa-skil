
// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number>()

  static startMeasurement(name: string) {
    this.measurements.set(name, performance.now())
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name)
    if (!startTime) {
      console.warn(`No start measurement found for: ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.delete(name)
    
    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
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
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`${name} completed in ${duration.toFixed(2)}ms`)
        }
        
        resolve(result)
      } catch (error) {
        this.endMeasurement(name)
        reject(error)
      }
    })
  }

  static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return null
  }

  static logMemoryUsage() {
    const memory = this.getMemoryUsage()
    if (memory && process.env.NODE_ENV === 'development') {
      console.log('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }
}

// Auto-log memory usage every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    PerformanceMonitor.logMemoryUsage()
  }, 30000)
}
