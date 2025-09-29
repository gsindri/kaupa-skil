import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import i18n, { AppLanguage, supportedLanguages } from '@/lib/i18n'

export type Language = AppLanguage

const LANGUAGE_STORAGE_KEY = 'app-language'

const isSupportedLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && supportedLanguages.some((lang) => lang === value)

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'is'
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isSupportedLanguage(saved) ? saved : 'is'
  })

  const applyLanguage = useCallback((lang: Language) => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [])

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState((prev) => (prev === lang ? prev : lang))
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      }
      applyLanguage(lang)
    },
    [applyLanguage],
  )

  useEffect(() => {
    applyLanguage(language)
  }, [applyLanguage, language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}

