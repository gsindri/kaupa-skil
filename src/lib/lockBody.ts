let lockCount = 0
let originalPaddingRight = ''
let originalOverflow = ''

export function lockBody() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) {
    let scrollBarGap =
      window.innerWidth - document.documentElement.clientWidth
    const root = getComputedStyle(document.documentElement) as any
    const gutterReserved =
      (root.scrollbarGutter && root.scrollbarGutter !== 'auto') ||
      root.overflowY === 'scroll'
    if (gutterReserved) scrollBarGap = 0
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
