import { useCallback, useEffect, useRef } from 'react'

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

    let interactionLockUntil = 0
    const lockFor = (ms: number) => {
      interactionLockUntil = performance.now() + ms
    }
    const handlePointerDown = () => lockFor(180)
    el.addEventListener('pointerdown', handlePointerDown, { passive: true })

    let lastY = Math.max(0, window.scrollY)
    let hiddenProgress = 0
    let headerHeight = 1

    const setHiddenProgress = (value: number) => {
      const clamped = Math.min(1, Math.max(0, value))
      if (clamped === hiddenProgress) return
      hiddenProgress = clamped
      document.documentElement.style.setProperty('--header-hidden', `${hiddenProgress}`)
    }

    const setHeaderVars = () => {
      const height = Math.round(el.getBoundingClientRect().height)
      headerHeight = height > 0 ? height : 1
      document.documentElement.style.setProperty('--header-h', `${height}px`)
    }
    setHeaderVars()
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(setHeaderVars)
        : null
    ro?.observe(el)
    window.addEventListener('resize', setHeaderVars)

    const resetScrollState = (y: number) => {
      lastY = y
      setHiddenProgress(0)
    }

    applyTransition()
    document.documentElement.style.setProperty('--header-hidden', '0')
    el.style.transform = 'translate3d(0, calc(-1 * var(--header-hidden) * var(--header-h)), 0)'

    const pinned = () =>
      (isPinned?.() ?? false) || lockCount.current > 0 || performance.now() < interactionLockUntil

    const onScroll = () => {
      const y = Math.max(0, window.scrollY)

      if (pinned()) {
        if (hiddenProgress !== 0) setHiddenProgress(0)
        resetScrollState(y)
        return
      }

      const delta = y - lastY
      lastY = y
      if (delta === 0) {
        return
      }

      if (delta < 0) {
        if (hiddenProgress !== 0) setHiddenProgress(0)
        return
      }

      const nextProgress = hiddenProgress + delta / headerHeight
      setHiddenProgress(nextProgress)
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
