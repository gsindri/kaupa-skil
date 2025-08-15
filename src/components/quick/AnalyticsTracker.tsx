
import React, { useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/performance'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

class AnalyticsTracker {
  private static events: AnalyticsEvent[] = []
  
  static track(event: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics:', event, properties)
    }
    
    this.events.push({ event, properties })
    
    // In production, you would send this to your analytics service
    // Example: analytics.track(event, properties)
  }
  
  static getEvents() {
    return this.events
  }
  
  static clearEvents() {
    this.events = []
  }
}

interface AnalyticsTrackerProps {
  searchQuery?: string
  resultCount?: number
  userMode?: string
}

export function AnalyticsTrackerComponent({ 
  searchQuery, 
  resultCount, 
  userMode 
}: AnalyticsTrackerProps) {
  useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      AnalyticsTracker.track('search_performed', {
        query: searchQuery,
        resultCount,
        userMode,
        timestamp: Date.now()
      })
    }
  }, [searchQuery, resultCount, userMode])

  useEffect(() => {
    // Track performance metrics periodically
    const interval = setInterval(() => {
      const metrics = PerformanceMonitor.getPerformanceMetrics()
      if (metrics.memory) {
        AnalyticsTracker.track('performance_metrics', {
          memoryUsed: metrics.memory.used,
          memoryTotal: metrics.memory.total,
          timestamp: Date.now()
        })
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}

export { AnalyticsTracker }
