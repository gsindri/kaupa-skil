import { useCallback, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageProvider'
import en from '@/locales/en.json'
import is from '@/locales/is.json'

type LocaleCode = 'en' | 'is'

type TranslationRecord = Record<string, unknown>

type PluralForms = Record<string, string>

type TranslateOptions = {
  count?: number
  values?: Record<string, string | number>
}

const resources: Record<LocaleCode, TranslationRecord> = {
  en,
  is
}

const pluralRules: Record<LocaleCode, Intl.PluralRules> = {
  en: new Intl.PluralRules('en'),
  is: new Intl.PluralRules('is')
}

function resolvePath(record: TranslationRecord, path: string[]): unknown {
  return path.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, record)
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key]
    return value !== undefined && value !== null ? String(value) : match
  })
}

function translateRaw(
  locale: LocaleCode,
  key: string,
  options: TranslateOptions = {}
): string {
  const parts = key.split('.').filter(Boolean)
  if (parts.length === 0) return key

  const localeRecord = resources[locale] ?? resources.is
  const fallbackRecord = resources.en

  const value =
    resolvePath(localeRecord, parts) ?? resolvePath(fallbackRecord, parts) ?? key

  if (typeof value === 'string') {
    return interpolate(value, { ...options.values, count: options.count })
  }

  if (options.count !== undefined && value && typeof value === 'object') {
    const rules = pluralRules[locale] ?? pluralRules.en
    const form = rules.select(options.count)
    const pluralMap = value as PluralForms
    const template = pluralMap[form] ?? pluralMap.other ?? pluralMap.one
    if (typeof template === 'string') {
      return interpolate(template, { ...options.values, count: options.count })
    }
  }

  if (value && typeof value === 'object' && 'other' in (value as PluralForms)) {
    const pluralMap = value as PluralForms
    const template = pluralMap.other
    if (typeof template === 'string') {
      return interpolate(template, { ...options.values, count: options.count })
    }
  }

  return key
}

export function useTranslation(namespace?: string) {
  const { language } = useLanguage()
  const locale = (language ?? 'is') as LocaleCode

  const prefix = useMemo(() => (namespace ? `${namespace}.` : ''), [namespace])

  const t = useCallback(
    (key: string, options?: TranslateOptions) =>
      translateRaw(locale, `${prefix}${key}`, options),
    [locale, prefix]
  )

  return { t, locale }
}

export function translateKey(
  key: string,
  locale: LocaleCode = 'en',
  options?: TranslateOptions
) {
  return translateRaw(locale, key, options)
}

export const availableLanguages: LocaleCode[] = ['is', 'en']
