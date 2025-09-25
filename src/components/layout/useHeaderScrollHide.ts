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

    // Respect reduced motion
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const currentP = { current: 0 }
    let snapFrame: number | null = null
    let snapTarget: number | null = null

    const commit = (p: number) => {
      const v = p < 0.02 ? 0 : p > 0.98 ? 1 : p
      const val = v.toFixed(3)
      currentP.current = Number(val)
      el.style.setProperty('--hdr-p', val)
      document.documentElement.style.setProperty('--hdr-p', val)
    }

    const stopSnap = () => {
      if (snapFrame !== null) {
        cancelAnimationFrame(snapFrame)
        snapFrame = null
      }
      snapTarget = null
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const HIDE_SNAP_MS = 220
    const SHOW_SNAP_MS = 260

    const animateTo = (target: number, duration: number) => {
      if (reduceMotion) {
        stopSnap()
        commit(target)
        return
      }

      const clamped = Math.max(0, Math.min(1, target))
      const start = currentP.current
      if (Math.abs(clamped - start) <= 0.001) {
        stopSnap()
        commit(clamped)
        return
      }

      stopSnap()
      const startTime = performance.now()
      snapTarget = clamped

      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        const value = start + (clamped - start) * easeOutCubic(t)
        commit(value)
        if (t < 1) {
          snapFrame = requestAnimationFrame(tick)
        } else {
          snapFrame = null
          snapTarget = null
        }
      }

      snapFrame = requestAnimationFrame(tick)
    }

    const setP = (p: number, options?: { animated?: boolean; duration?: number }) => {
      if (options?.animated) {
        animateTo(p, options.duration ?? (p > currentP.current ? HIDE_SNAP_MS : SHOW_SNAP_MS))
        return
      }
      if (snapTarget !== null && Math.abs(snapTarget - p) <= 0.001) {
        return
      }
      stopSnap()
      commit(p)
    }

    let H = Math.round(el.getBoundingClientRect().height)
    const setHeaderVars = () => {
      H = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${H}px`)
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

    // Tunables
    const PROGRESS_START = 10
    const GAP = 24
    const MIN_DY = 0.25
    const SNAP_COOLDOWN_MS = 200
    const REVEAL_DIST = 32
    const REHIDE_DIST = 32
    const TOP_PIN_THRESHOLD = 64
    const HIDE_DISTANCE = 24
    const SHOW_DISTANCE = 16
    const VELOCITY_LERP = 0.18
    const MIN_TOGGLE_VELOCITY = 0.08

    let lastY = window.scrollY
    let acc = 0
    let lastDir: -1 | 0 | 1 = 0
    let lock: 'none' | 'visible' | 'hidden' = 'none'
    let lastSnapDir: -1 | 0 | 1 = 0
    let lastSnapTime = 0
    let lastSnapY = 0
    let velocity = 0
    let lastSampleTime = performance.now()

    const pinned = () =>
      (isPinned?.() ?? false) || lockCount.current > 0 || performance.now() < interactionLockUntil

    const onScroll = () => {
      const y = Math.max(0, window.scrollY)
      const dy = y - lastY
      lastY = y
      const now = performance.now()
      const dt = Math.max(1, now - lastSampleTime)
      const instantaneous = dy / dt
      velocity = velocity + (instantaneous - velocity) * VELOCITY_LERP
      lastSampleTime = now

      if (reduceMotion) {
        setP(0)
        return
      }

      if (pinned()) {
        lock = 'none'
        acc = 0
        lastDir = 0
        velocity = 0
        setP(0)
        return
      }

      if (lock === 'visible' && y <= H - GAP) lock = 'none'
      if (lock === 'hidden' && y >= H + GAP) lock = 'none'

      if (y <= TOP_PIN_THRESHOLD) {
        lock = 'none'
        acc = 0
        velocity = 0
        lastDir = 0
        lastSnapDir = 0
        setP(0)
        return
      }

      if (y < H) {
        const dir: -1 | 0 | 1 = Math.abs(dy) < MIN_DY ? 0 : dy > 0 ? 1 : -1
        if (lock === 'visible' || dir <= 0) {
          acc = 0
          velocity = 0
          lastDir = dir
          setP(0)
          return
        }
        const span = Math.max(1, H - PROGRESS_START)
        const t = Math.max(0, y - PROGRESS_START) / span
        const p = 1 - Math.pow(1 - t, 3)
        acc = 0
        lastDir = dir
        setP(p)
        return
      }

      if (lock === 'hidden') {
        setP(1)
        return
      }

      const dir: -1 | 0 | 1 = Math.abs(dy) < MIN_DY ? 0 : dy > 0 ? 1 : -1
      if (dir !== 0) {
        if (dir !== lastDir) acc = 0
        acc += dy
        lastDir = dir
        const speed = Math.abs(velocity)
        if (dir > 0 && acc >= HIDE_DISTANCE && speed >= MIN_TOGGLE_VELOCITY) {
          if (
            lastSnapDir === -1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || y - lastSnapY < REHIDE_DIST)
          ) {
            // keep visible
          } else {
            setP(1, { animated: true, duration: HIDE_SNAP_MS })
            lock = 'hidden'
            acc = 0
            velocity = 0
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }
        if (dir < 0 && acc <= -SHOW_DISTANCE && speed >= MIN_TOGGLE_VELOCITY) {
          if (
            lastSnapDir === 1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || lastSnapY - y < REVEAL_DIST)
          ) {
            // keep hidden
          } else {
            setP(0, { animated: true, duration: SHOW_SNAP_MS })
            lock = 'visible'
            acc = 0
            velocity = 0
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }
      }
    }

    const listener = () => requestAnimationFrame(onScroll)
    window.addEventListener('scroll', listener, { passive: true })

    const wheel = (e: WheelEvent) => {
      if (window.scrollY >= H + GAP) {
        const now = performance.now()
        if (e.deltaY > 0) {
          if (!(lastSnapDir === -1 && now - lastSnapTime < SNAP_COOLDOWN_MS)) {
            setP(1, { animated: true, duration: HIDE_SNAP_MS })
            lock = 'hidden'
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        } else if (e.deltaY < 0) {
          if (!(lastSnapDir === 1 && now - lastSnapTime < SNAP_COOLDOWN_MS)) {
            setP(0, { animated: true, duration: SHOW_SNAP_MS })
            lock = 'visible'
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        }
      }
    }
    window.addEventListener('wheel', wheel, { passive: true })

    // Initial apply
    listener()

    return () => {
      stopSnap()
      document.documentElement.style.setProperty('--hdr-p', '0')
      window.removeEventListener('scroll', listener)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('resize', setHeaderVars)
      el.removeEventListener('pointerdown', handlePointerDown)
      ro?.disconnect()
    }
  }, [ref, isPinned])

  return handleLockChange
}

export default useHeaderScrollHide
