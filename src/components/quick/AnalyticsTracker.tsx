
import React, { useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/performance'
import { AnalyticsTracker } from './AnalyticsTrackerUtils'

interface AnalyticsTrackerProps {
  searchQuery?: string
  resultCount?: number
  userMode?: string
}

export default function AnalyticsTrackerComponent({
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
