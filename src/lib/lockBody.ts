let lockCount = 0
let originalPaddingRight = ''
let originalOverflow = ''

export function lockBody() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) {
    let scrollBarGap = window.innerWidth - document.documentElement.clientWidth
    const scrollbarGutter = (
      getComputedStyle(document.documentElement) as any
    ).scrollbarGutter
    if (scrollbarGutter && scrollbarGutter !== 'auto') {
      scrollBarGap = 0
    }
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
