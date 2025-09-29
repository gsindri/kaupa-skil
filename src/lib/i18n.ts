import i18next from 'i18next'
import {
  KeyPrefix,
  UseTranslationOptions,
  UseTranslationResponse,
  initReactI18next,
  useTranslation as useTranslationBase,
} from 'react-i18next'

const translationEn = {
  navigation: {
    home: 'Home',
    search: 'Search',
    profile: {
      overview: 'Profile overview',
      settings: 'Settings',
      signOut: 'Sign out',
    },
  },
  common: {
    language: 'Language',
    icelandic: 'Icelandic',
    english: 'English',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
} as const

const translationIs = {
  navigation: {
    home: 'Heim',
    search: 'Leita',
    profile: {
      overview: 'Yfirlit prófíls',
      settings: 'Stillingar',
      signOut: 'Skrá út',
    },
  },
  common: {
    language: 'Tungumál',
    icelandic: 'Íslenska',
    english: 'Enska',
    cancel: 'Hætta við',
    confirm: 'Staðfesta',
  },
} as const

export const defaultNS = 'translation'

export const resources = {
  en: {
    [defaultNS]: translationEn,
  },
  is: {
    [defaultNS]: translationIs,
  },
} as const

export type AppLanguage = keyof typeof resources
export const supportedLanguages = Object.keys(resources) as AppLanguage[]
export const fallbackLanguage: AppLanguage = 'en'

const i18n = i18next.createInstance()

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'is',
      fallbackLng: fallbackLanguage,
      supportedLngs: supportedLanguages,
      defaultNS,
      interpolation: { escapeValue: false },
      returnNull: false,
    })
}

type AppNamespace = typeof defaultNS
export type AppTranslations = (typeof resources)['en'][AppNamespace]

export function useTranslation<TPrefix extends KeyPrefix<AppNamespace> = undefined>(
  options?: UseTranslationOptions<TPrefix>,
): UseTranslationResponse<AppNamespace, TPrefix> {
  return useTranslationBase<AppNamespace, TPrefix>(defaultNS, options)
}

export default i18n

export { i18n }

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['en']
    returnNull: false
  }
}
