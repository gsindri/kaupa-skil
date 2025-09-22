import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { guessLocaleRegion } from './locale'

export interface NormalizedPhoneResult {
  formatted: string
  isValid: boolean
}

export function getDefaultCountryCode(): CountryCode {
  const region = guessLocaleRegion()
  return (region as CountryCode) || 'IS'
}

export function normalizePhoneInput(value: string, country?: CountryCode): NormalizedPhoneResult {
  const trimmed = value.trim()
  if (!trimmed) {
    return { formatted: '', isValid: false }
  }

  try {
    const phone = parsePhoneNumberFromString(trimmed, country)
    if (!phone) {
      return { formatted: trimmed, isValid: false }
    }
    return { formatted: phone.number, isValid: phone.isValid() }
  } catch (error) {
    return { formatted: trimmed.replace(/\s+/g, ''), isValid: false }
  }
}

export function isValidE164(value: string, country?: CountryCode) {
  if (!value) return false
  try {
    const phone = parsePhoneNumberFromString(value, country)
    return phone?.isValid() ?? false
  } catch (error) {
    return false
  }
}

export function formatVat(value: string) {
  const digits = value.replace(/[^0-9]/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 12) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  return value.trim()
}

export function isValidVat(value?: string) {
  if (!value) return false
  const digits = value.replace(/[^0-9]/g, '')
  return digits.length === 10 || digits.length === 12
}
