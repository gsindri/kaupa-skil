let lockCount = 0
let originalOverflow = ''

export function lockBody() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) {
    const root = document.documentElement
    originalOverflow = root.style.overflow
    root.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBody() {
  if (typeof window === 'undefined') return
  if (lockCount > 0) {
    lockCount--
    if (lockCount === 0) {
      document.documentElement.style.overflow = originalOverflow
    }
  }
}
