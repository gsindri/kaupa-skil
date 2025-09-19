import { useMemo } from 'react'

const CURRENCY_MAP: Record<string, string> = {
  IS: 'ISK',
  US: 'USD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  NO: 'NOK',
  SE: 'SEK',
  DK: 'DKK',
  FI: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
}

export function guessLocaleRegion(): string {
  if (typeof window === 'undefined') {
    return 'IS'
  }

  const locales = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language]

  for (const locale of locales) {
    if (!locale) continue
    const parts = locale.split('-')
    if (parts.length > 1) {
      return parts[1]?.toUpperCase() || 'IS'
    }
  }

  return 'IS'
}

export function guessDefaultLanguage(): string {
  if (typeof window === 'undefined') {
    return 'is-IS'
  }

  const locales = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language]

  const primary = locales.find(Boolean)
  if (!primary) return 'is-IS'
  const normalized = primary.includes('-') ? primary : `${primary}-${guessLocaleRegion()}`
  return normalized
}

export function guessDefaultCurrency(region?: string): string {
  const upperRegion = (region || guessLocaleRegion()).toUpperCase()
  return CURRENCY_MAP[upperRegion] || 'EUR'
}

export function useLocaleDefaults() {
  return useMemo(() => {
    const region = guessLocaleRegion()
    return {
      region,
      language: guessDefaultLanguage(),
      currency: guessDefaultCurrency(region)
    }
  }, [])
}
