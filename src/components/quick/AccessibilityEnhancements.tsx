
import React, { useEffect } from 'react'

export function AccessibilityEnhancements() {
  useEffect(() => {
    // Add focus management for keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content with Alt+M
      if (e.altKey && e.key === 'm') {
        e.preventDefault()
        const main = document.querySelector('main')
        if (main) {
          main.focus()
          main.scrollIntoView({ behavior: 'smooth' })
        }
      }
      
      // Skip to search with Alt+S
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Skip to cart with Alt+C
      if (e.altKey && e.key === 'c') {
        e.preventDefault()
        const cartButton = document.querySelector('button[aria-label*="cart"], button:has([data-testid="shopping-cart"])')
        if (cartButton) {
          (cartButton as HTMLButtonElement).click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="sr-only" aria-live="polite" id="accessibility-announcements">
      {/* Screen reader announcements will be inserted here */}
    </div>
  )
}

export function announceToScreenReader(message: string) {
  const announcer = document.getElementById('accessibility-announcements')
  if (announcer) {
    announcer.textContent = message
    // Clear after a delay to allow for repeated announcements
    setTimeout(() => {
      announcer.textContent = ''
    }, 1000)
  }
}
