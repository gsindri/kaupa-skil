import { useCallback, useEffect, useRef } from 'react'

const HIDE_DELTA = 8

interface Options {
  /**
   * Return true when header should remain pinned (always visible)
   */
  isPinned?: () => boolean
  /**
   * Optional callback notified when lock state changes
   */
  onLockChange?: (locked: boolean) => void
}

/**
 * Auto-hides the header on downward scroll and reveals on upward scroll.
 * Updates `--hdr-p` CSS variable on both the header element and documentElement
 * and maintains `--header-h` via ResizeObserver.
 */
export function useHeaderScrollHide(
  ref: React.RefObject<HTMLElement>,
  { isPinned, onLockChange }: Options = {}
) {
  const lockCount = useRef(0)
  const handleLockChange = useCallback(
    (locked: boolean) => {
      lockCount.current += locked ? 1 : -1
      if (lockCount.current < 0) lockCount.current = 0
      onLockChange?.(lockCount.current > 0)
    },
    [onLockChange]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const applyTransition = () => {
      if (reduceMotion) {
        el.style.removeProperty('transition')
      } else {
        el.style.transition = 'transform 200ms ease-in-out'
      }
    }

    const setHeaderVars = () => {
      const height = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${height}px`)
    }
    setHeaderVars()
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(setHeaderVars)
        : null
    ro?.observe(el)
    window.addEventListener('resize', setHeaderVars)

    let interactionLockUntil = 0
    const lockFor = (ms: number) => {
      interactionLockUntil = performance.now() + ms
    }
    const handlePointerDown = () => lockFor(180)
    el.addEventListener('pointerdown', handlePointerDown, { passive: true })

    let lastY = Math.max(0, window.scrollY)
    let accumulatedDelta = 0
    let hidden = false

    const resetScrollState = (y: number) => {
      lastY = y
      accumulatedDelta = 0
    }

    const applyHidden = (nextHidden: boolean) => {
      if (hidden === nextHidden) return
      hidden = nextHidden
      document.documentElement.style.setProperty('--header-hidden', hidden ? '1' : '0')
      applyTransition()
      el.style.transform = hidden ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)'
    }

    applyTransition()
    document.documentElement.style.setProperty('--header-hidden', '0')
    el.style.transform = 'translate3d(0, 0, 0)'

    const pinned = () =>
      (isPinned?.() ?? false) || lockCount.current > 0 || performance.now() < interactionLockUntil

    const onScroll = () => {
      const y = Math.max(0, window.scrollY)

      if (pinned()) {
        if (hidden) applyHidden(false)
        resetScrollState(y)
        return
      }

      const delta = y - lastY
      lastY = y
      if (delta === 0) {
        return
      }

      if (Math.sign(delta) !== Math.sign(accumulatedDelta)) {
        accumulatedDelta = delta
      } else {
        accumulatedDelta += delta
      }

      if (Math.abs(accumulatedDelta) > HIDE_DELTA) {
        applyHidden(accumulatedDelta > 0)
        accumulatedDelta = 0
      }
    }

    const handleScroll = () => requestAnimationFrame(onScroll)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', setHeaderVars)
      el.removeEventListener('pointerdown', handlePointerDown)
      ro?.disconnect()
      document.documentElement.style.setProperty('--header-hidden', '0')
      if (!reduceMotion) {
        el.style.removeProperty('transition')
      }
      el.style.transform = 'translate3d(0, 0, 0)'
    }
  }, [ref, isPinned])

  return handleLockChange
}

export default useHeaderScrollHide
