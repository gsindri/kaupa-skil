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
  const hiddenRef = useRef(false)
  const lastYRef = useRef(0)
  const accumulatedDeltaRef = useRef(0)

  const handleLockChange = useCallback(
    (locked: boolean) => {
      lockCount.current += locked ? 1 : -1
      if (lockCount.current < 0) lockCount.current = 0
      onLockChange?.(lockCount.current > 0)
    },
    [onLockChange]
  )

  const reset = useCallback(() => {
    if (!ref.current) return
    
    // Force header visible via CSS variable
    document.documentElement.style.setProperty('--header-hidden', '0')
    
    // Reset internal state
    hiddenRef.current = false
    lastYRef.current = Math.max(0, window.scrollY)
    accumulatedDeltaRef.current = 0
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return

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

    lastYRef.current = Math.max(0, window.scrollY)

    const resetScrollState = (y: number) => {
      lastYRef.current = y
      accumulatedDeltaRef.current = 0
    }

    const applyHidden = (nextHidden: boolean) => {
      if (hiddenRef.current === nextHidden) return
      hiddenRef.current = nextHidden
      document.documentElement.style.setProperty('--header-hidden', hiddenRef.current ? '1' : '0')
    }

    document.documentElement.style.setProperty('--header-hidden', '0')

    const pinned = () =>
      (isPinned?.() ?? false) || lockCount.current > 0 || performance.now() < interactionLockUntil

    const onScroll = () => {
      const y = Math.max(0, window.scrollY)

      if (pinned()) {
        if (hiddenRef.current) applyHidden(false)
        resetScrollState(y)
        return
      }

      const delta = y - lastYRef.current
      lastYRef.current = y
      if (delta === 0) {
        return
      }

      if (Math.sign(delta) !== Math.sign(accumulatedDeltaRef.current)) {
        accumulatedDeltaRef.current = delta
      } else {
        accumulatedDeltaRef.current += delta
      }

      if (Math.abs(accumulatedDeltaRef.current) > HIDE_DELTA) {
        applyHidden(accumulatedDeltaRef.current > 0)
        accumulatedDeltaRef.current = 0
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
    }
  }, [ref, isPinned, reset])

  return { handleLockChange, reset }
}

export default useHeaderScrollHide
