import React, { useEffect, useRef } from 'react'

interface InfiniteSentinelProps {
  onVisible: () => void
  disabled?: boolean
  root?: Element | null
  rootMargin?: string
  threshold?: number
}

export function InfiniteSentinel({
  onVisible,
  disabled = false,
  root = null,
  rootMargin,
  threshold,
}: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (disabled || !ref.current) return

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          onVisible()
          observerRef.current?.disconnect()
          observerRef.current = null
        }
      },
      { root, rootMargin, threshold },
    )

    observerRef.current.observe(ref.current)

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [disabled, root, rootMargin, threshold, onVisible])

  return <div ref={ref} aria-hidden="true" className="sr-only" />
}

export default InfiniteSentinel
