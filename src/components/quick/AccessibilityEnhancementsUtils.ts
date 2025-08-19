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
