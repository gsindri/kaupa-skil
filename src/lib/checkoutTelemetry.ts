export type CheckoutTelemetryEvent =
  | 'open_modal'
  | 'open_email_method'
  | 'mark_sent'
  | 'resend'
  | 'blocked_pricing'
  | 'blocked_minimum'
  | 'send_all_clicked'
  | 'send_all_completed_count'

interface CheckoutTelemetryPayload {
  supplierId?: string
  method?: string
  count?: number
  status?: string
}

export function trackCheckoutEvent(
  event: CheckoutTelemetryEvent,
  payload: CheckoutTelemetryPayload = {},
) {
  if (typeof window === 'undefined') {
    return
  }

  const entry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  }

  // Placeholder: hook into real analytics backend when available.
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('checkout-telemetry', { detail: entry }))
  }

  if (import.meta.env.DEV) {
    console.info('[checkout-telemetry]', entry)
  }
}
