let lockCount = 0
let scrollTop = 0
let currentTarget: HTMLElement | null = null

export function lockScroll(target: HTMLElement | null = document.documentElement as HTMLElement) {
  if (!target) return
  if (lockCount === 0) {
    currentTarget = target
    scrollTop = target.scrollTop

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    target.dataset.prevOverflow = target.style.overflow || ''
    target.dataset.prevTouchAction = target.style.touchAction || ''
    target.dataset.prevPaddingRight = target.style.paddingRight || ''

    target.style.overflow = 'hidden'
  }
}
