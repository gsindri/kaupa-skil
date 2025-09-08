let lockCount = 0
let scrollTop = 0
let currentTarget: HTMLElement | null = null

export function lockScroll(target: HTMLElement | null = document.documentElement as HTMLElement) {
  if (!target) return
  if (lockCount === 0) {
    currentTarget = target
    scrollTop = target.scrollTop
    target.dataset.prevOverflow = target.style.overflow || ''
    target.dataset.prevTouchAction = target.style.touchAction || ''
    target.style.overflow = 'hidden'
    target.style.touchAction = 'none'
    target.setAttribute('data-scroll-locked', '1')
  }
  lockCount++
}

export function unlockScroll(
  target: HTMLElement | null = currentTarget || (document.documentElement as HTMLElement),
) {
  if (!target) return
  if (lockCount > 0) {
    lockCount--
    if (lockCount === 0) {
      target.style.overflow = target.dataset.prevOverflow || ''
      target.style.touchAction = target.dataset.prevTouchAction || ''
      target.scrollTop = scrollTop
      delete target.dataset.prevOverflow
      delete target.dataset.prevTouchAction
      target.removeAttribute('data-scroll-locked')
      currentTarget = null
    }
  }
}
