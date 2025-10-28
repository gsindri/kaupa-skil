import { useEffect, useRef, useState } from "react"

type Options = {
  thresholdPx?: number
  minVelocity?: number
  disabled?: boolean
  headerId?: string
  spacerId?: string
  root?: HTMLElement | null
  initiallyHidden?: boolean
}

/**
 * Auto-hides header using position: fixed and animating the top property.
 * Uses a spacer element to prevent layout shifts.
 */
export function useAutoHideHeader({
  thresholdPx = 24,
  minVelocity = 2,
  disabled = false,
  headerId = "app-header",
  spacerId = "app-header-spacer",
  root = null,
  initiallyHidden = false,
}: Options = {}) {
  const lastY = useRef(0)
  const lastT = useRef(performance.now())
  const [hidden, setHidden] = useState(initiallyHidden)

  // Reveal header when hook becomes enabled
  useEffect(() => {
    if (!disabled && hidden) {
      setHidden(false)
    }
  }, [disabled, hidden])

  useEffect(() => {
    if (disabled) return

    const scroller = root ?? window
    const getY = () =>
      root ? (root as HTMLElement).scrollTop : window.scrollY

    const onScroll = () => {
      const now = performance.now()
      const y = getY()
      const dy = y - lastY.current
      const dt = Math.max(1, now - lastT.current)
      const vel = dy / dt

      // Reveal at top
      if (y < 8 && hidden) setHidden(false)

      // Direction + thresholds
      if (dy > thresholdPx && Math.abs(vel) > minVelocity / 1000) setHidden(true)
      else if (dy < -thresholdPx) setHidden(false)

      lastY.current = y
      lastT.current = now
    }

    // Init refs
    lastY.current = getY()
    lastT.current = performance.now()

    scroller.addEventListener("scroll", onScroll, { passive: true })
    return () => scroller.removeEventListener("scroll", onScroll)
  }, [disabled, root, thresholdPx, minVelocity, hidden])

  // Apply style changes (fixed + top)
  useEffect(() => {
    const header = document.getElementById(headerId)
    const spacer = document.getElementById(spacerId)
    if (!header || !spacer) return

    const ro = new ResizeObserver(() => {
      const h = header.getBoundingClientRect().height
      header.style.setProperty("--header-h", `${h}px`)
      document.documentElement.style.setProperty("--header-h", `${h}px`)
      spacer.style.height = `${h}px`
    })
    ro.observe(header)

    // Fixed positioning once
    header.style.position = "fixed"
    header.style.left = "0"
    header.style.right = "0"
    header.style.willChange = "top"
    
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (!reduceMotion) {
      header.style.transition = "top 280ms cubic-bezier(.2,.8,.2,1)"
    }

    return () => {
      ro.disconnect()
      header.style.removeProperty("position")
      header.style.removeProperty("left")
      header.style.removeProperty("right")
      header.style.removeProperty("willChange")
      header.style.removeProperty("transition")
      header.style.removeProperty("top")
      header.style.removeProperty("--header-h")
      spacer.style.removeProperty("height")
    }
  }, [headerId, spacerId])

  useEffect(() => {
    const header = document.getElementById(headerId)
    if (!header) return
    const top = hidden ? "calc(-1 * var(--header-h, 64px))" : "0px"
    header.style.top = top
    document.documentElement.style.setProperty("--header-hidden", hidden ? "1" : "0")
  }, [hidden, headerId])

  return { hidden }
}
