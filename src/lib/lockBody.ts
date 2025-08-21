let lockCount = 0
let originalPaddingRight = ''
let originalOverflow = ''

export function lockBody() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) {
    const scrollBarGap = window.innerWidth - document.documentElement.clientWidth
    originalPaddingRight = document.body.style.paddingRight
    originalOverflow = document.body.style.overflow
    if (scrollBarGap > 0) {
      document.body.style.paddingRight = `${scrollBarGap}px`
    }
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBody() {
  if (typeof window === 'undefined') return
  if (lockCount > 0) {
    lockCount--
    if (lockCount === 0) {
      document.body.style.paddingRight = originalPaddingRight
      document.body.style.overflow = originalOverflow
    }
  }
}
