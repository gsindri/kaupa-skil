import React from 'react'
import { Pencil, Building2, Users2, Languages, Coins } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { BUSINESS_TYPE_VALUES, type OrganizationBasicsFormValues } from './OrganizationBasicsStep'
import type { ContactInformationFormValues } from './ContactInformationStep'
import type { DeliveryDetailsFormValues } from './DeliveryDetailsStep'
import type { InvoicingSetupFormValues } from './InvoicingSetupStep'
import type { SupplierOption } from './SupplierSelectionStep'

// Combined organization data type
export type OrganizationFormValues = OrganizationBasicsFormValues & 
  ContactInformationFormValues & 
  DeliveryDetailsFormValues & 
  InvoicingSetupFormValues

export interface ReviewPreferences {
  language: string
  currency: string
}

interface ReviewStepProps {
  organization: OrganizationFormValues
  suppliers: SupplierOption[]
  selectedSupplierIds: string[]
  preferences: ReviewPreferences
  onPreferencesChange: (prefs: ReviewPreferences) => void
  onEditOrganization: () => void
  onEditSuppliers: () => void
  footer: React.ReactNode
  error?: string | null
}

const LANGUAGE_OPTIONS = [
  { value: 'is-IS', labelKey: 'is-IS' },
  { value: 'en-IS', labelKey: 'en-IS' },
  { value: 'en-GB', labelKey: 'en-GB' },
  { value: 'en-US', labelKey: 'en-US' }
]

const CURRENCY_OPTIONS = [
  { value: 'ISK', labelKey: 'ISK' },
  { value: 'EUR', labelKey: 'EUR' },
  { value: 'USD', labelKey: 'USD' },
  { value: 'GBP', labelKey: 'GBP' },
  { value: 'SEK', labelKey: 'SEK' },
  { value: 'DKK', labelKey: 'DKK' },
  { value: 'NOK', labelKey: 'NOK' }
]

const formatAddress = (address: OrganizationFormValues['deliveryAddress']) => {
  const line1 = address.line1?.trim()
  const line2 = address.line2?.trim()
  const postalCode = address.postalCode?.trim()
  const city = address.city?.trim()

  const lines: string[] = []
  if (line1) {
    lines.push(line1)
  }
  if (line2) {
    lines.push(line2)
  }
  const cityLine = [postalCode, city].filter(Boolean).join(' ')
  if (cityLine) {
    lines.push(cityLine)
  }

  return lines.join('\n')
}

export function ReviewStep({
  organization,
  suppliers,
  selectedSupplierIds,
  preferences,
  onPreferencesChange,
  onEditOrganization,
  onEditSuppliers,
  footer,
  error
}: ReviewStepProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'onboarding.steps.review' })
  const { t: tBasics } = useTranslation(undefined, { keyPrefix: 'onboarding.steps.organizationBasics' })
  const selectedSuppliers = selectedSupplierIds
    .map(id => suppliers.find(supplier => supplier.id === id) ?? null)
    .filter(Boolean) as SupplierOption[]

  const deliveryAddressText = formatAddress(organization.deliveryAddress)
  const invoiceAddressText = formatAddress(organization.invoiceAddress)
  const businessTypeLabel = organization.businessType
    ? tBasics(`businessTypes.${organization.businessType as (typeof BUSINESS_TYPE_VALUES)[number]}`)
    : undefined

  const organizationLogo = organization.logo ?? null

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('error.title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/40 p-4">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <Avatar className="mt-1 h-14 w-14 border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
              {organizationLogo?.dataUrl ? (
                <AvatarImage
                  src={organizationLogo.dataUrl}
                  alt={t('organization.section.logoAlt', {
                    name: organization.name || t('organization.section.emptyName')
                  })}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <AvatarFallback className="bg-[color:var(--surface-pop-2)] text-[color:var(--text-muted)]">
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <p className="flex items-center gap-2 text-[13px] uppercase tracking-wide text-[color:var(--text-muted)]">
                <Building2 className="h-4 w-4 text-[color:var(--brand-accent)]" />
                {t('organization.section.heading')}
              </p>
              <h3 className="text-[17px] font-semibold text-[color:var(--text)]">
                {organization.name || t('organization.section.emptyName')}
              </h3>
              <p className="text-[13px] text-[color:var(--text-muted)]">{t('organization.section.description')}</p>
              <p className="text-[12px] text-[color:var(--text-muted)]">
                {organizationLogo ? organizationLogo.fileName : t('organization.section.logoFallback')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-[13px]" onClick={onEditOrganization}>
            <Pencil className="h-4 w-4" /> {t('organization.actions.edit')}
          </Button>
        </header>
        <dl className="grid gap-4 text-[13px] text-[color:var(--text-muted)] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.contactName')}</dt>
            <dd>{organization.contactName || t('organization.fields.addLater')}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.phone')}</dt>
            <dd>{organization.phone || t('organization.fields.addLater')}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.email')}</dt>
            <dd>{organization.email || t('organization.fields.addLater')}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.businessType')}</dt>
            <dd>{businessTypeLabel ?? t('organization.fields.notSpecified')}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.vat')}</dt>
            <dd>{organization.vat || t('organization.fields.missing')}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.deliveryAddress')}</dt>
            <dd>
              {deliveryAddressText ? (
                <address className="not-italic whitespace-pre-line">{deliveryAddressText}</address>
              ) : (
                t('organization.fields.addLater')
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[color:var(--text)]">{t('organization.fields.invoiceAddress')}</dt>
            <dd>
              {organization.useSeparateInvoiceAddress ? (
                invoiceAddressText ? (
                  <address className="not-italic whitespace-pre-line">{invoiceAddressText}</address>
                ) : (
                  t('organization.fields.addLater')
                )
              ) : deliveryAddressText ? (
                t('organization.fields.sameAsDelivery')
              ) : (
                t('organization.fields.addLater')
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/40 p-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[13px] uppercase tracking-wide text-[color:var(--text-muted)]">
              <Users2 className="h-4 w-4 text-[color:var(--brand-accent)]" />
              {t('suppliers.section.heading')}
            </p>
            <h3 className="text-[17px] font-semibold text-[color:var(--text)]">
              {t('suppliers.summary', { count: selectedSuppliers.length })}
            </h3>
            <p className="text-[13px] text-[color:var(--text-muted)]">
              {t('suppliers.description')}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-[13px]" onClick={onEditSuppliers}>
            <Pencil className="h-4 w-4" /> {t('suppliers.actions.edit')}
          </Button>
        </header>
        {selectedSuppliers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSuppliers.map(supplier => (
              <Badge
                key={supplier.id}
                className="gap-2 border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 text-[color:var(--brand-accent)]"
              >
                <Checkmark />
                {supplier.name}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/40 px-4 py-6 text-center text-[13px] text-[color:var(--text-muted)]">
            {t('suppliers.empty.message')}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/40 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-[color:var(--text-muted)]">
            <Languages className="h-4 w-4 text-[color:var(--brand-accent)]" /> {t('preferences.language.label')}
          </label>
          <Select
            value={preferences.language}
            onValueChange={value => onPreferencesChange({ ...preferences, language: value })}
          >
            <SelectTrigger className="h-10 rounded-[10px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
              <SelectValue placeholder={t('preferences.language.placeholder')} />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
              {LANGUAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-[13px]">
                  {t(`preferences.language.options.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-[color:var(--text-muted)]">
            <Coins className="h-4 w-4 text-[color:var(--brand-accent)]" /> {t('preferences.currency.label')}
          </label>
          <Select
            value={preferences.currency}
            onValueChange={value => onPreferencesChange({ ...preferences, currency: value })}
          >
            <SelectTrigger className="h-10 rounded-[10px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
              <SelectValue placeholder={t('preferences.currency.placeholder')} />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
              {CURRENCY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-[13px]">
                  {t(`preferences.currency.options.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-[color:var(--text-muted)]">{t('preferences.currency.help')}</p>
        </div>
      </section>

      {footer}
    </div>
  )
}

function Checkmark() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-accent)] text-[10px] font-semibold text-[color:var(--brand-accent-fg)]">
      ✓
    </span>
  )
}
