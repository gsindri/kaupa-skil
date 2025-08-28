interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

const ANALYTICS_DEBUG = (import.meta as any).env?.VITE_ANALYTICS_DEBUG === 'true'

export class AnalyticsTracker {
  private static events: AnalyticsEvent[] = []

  static track(event: string, properties?: Record<string, any>) {
    if (ANALYTICS_DEBUG) {
      console.debug('Analytics:', event, properties)
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
