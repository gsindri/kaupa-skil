interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

export class AnalyticsTracker {
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
