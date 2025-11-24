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
    target.dataset.prevPaddingRight = target.style.paddingRight || ''

    target.style.overflow = 'hidden'
    target.style.touchAction = 'none'
    target.dataset.scrollLocked = '1'
  }
  lockCount++
}

export function unlockScroll(target: HTMLElement | null = document.documentElement as HTMLElement) {
  if (!target) return
  lockCount--
  if (lockCount === 0 && currentTarget === target) {
    target.scrollTop = scrollTop
    target.style.overflow = target.dataset.prevOverflow || ''
    target.style.touchAction = target.dataset.prevTouchAction || ''
    target.style.paddingRight = target.dataset.prevPaddingRight || ''
    delete target.dataset.prevOverflow
    delete target.dataset.prevTouchAction
    delete target.dataset.prevPaddingRight
    delete target.dataset.scrollLocked
    currentTarget = null
  }
}
