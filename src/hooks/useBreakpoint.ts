import { useMediaQuery } from './useMediaQuery'

export const FILTERS_BREAKPOINT = '(min-width: 1024px)' // lg breakpoint

export function useBreakpoint() {
  const isLg = useMediaQuery(FILTERS_BREAKPOINT)
  const isMd = useMediaQuery('(min-width: 768px)')
  const isSm = useMediaQuery('(min-width: 640px)')

  return {
    isLg,
    isMd,
    isSm,
    isDesktop: isLg,
    isMobile: !isLg,
  }
}
