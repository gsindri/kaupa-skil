import i18n from 'i18next'
import ICU from 'i18next-icu'
import { initReactI18next, useTranslation } from 'react-i18next'

import en from '@/locales/en.json'
import is from '@/locales/is.json'

export const supportedLanguages = ['is', 'en'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

const resources = {
  en: { translation: en },
  is: { translation: is },
} as const

const DEFAULT_LANGUAGE: AppLanguage = 'is'

if (!i18n.isInitialized) {
  void i18n
    .use(new ICU())
    .use(initReactI18next)
    .init({
      resources,
      lng: DEFAULT_LANGUAGE,
      fallbackLng: 'en',
      supportedLngs: supportedLanguages as unknown as string[],
      interpolation: {
        escapeValue: false,
      },
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.error('Failed to initialise i18n instance', error)
      }
    })
}

export default i18n

export { useTranslation }
