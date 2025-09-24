import React from 'react'
import { Pencil, Building2, Users2, Languages, Coins } from 'lucide-react'

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

import { BUSINESS_TYPE_OPTIONS, type OrganizationBasicsFormValues } from './OrganizationBasicsStep'
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
  { value: 'is-IS', label: 'Icelandic' },
  { value: 'en-IS', label: 'English (Iceland)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-US', label: 'English (US)' }
]

const CURRENCY_OPTIONS = [
  { value: 'ISK', label: 'Icelandic króna (ISK)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'US dollar (USD)' },
  { value: 'GBP', label: 'Pound sterling (GBP)' },
  { value: 'SEK', label: 'Swedish krona (SEK)' },
  { value: 'DKK', label: 'Danish krone (DKK)' },
  { value: 'NOK', label: 'Norwegian krone (NOK)' }
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
  const selectedSuppliers = selectedSupplierIds
    .map(id => suppliers.find(supplier => supplier.id === id) ?? null)
    .filter(Boolean) as SupplierOption[]

  const deliveryAddressText = formatAddress(organization.deliveryAddress)
  const invoiceAddressText = formatAddress(organization.invoiceAddress)
  const businessTypeOption = organization.businessType
    ? BUSINESS_TYPE_OPTIONS.find(option => option.value === organization.businessType)
    : undefined

  const organizationLogo = organization.logo ?? null

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>We couldn’t finish setup</AlertTitle>
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
                  alt={`${organization.name || 'Organization'} logo`}
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
                Organization
              </p>
              <h3 className="text-[17px] font-semibold text-[color:var(--text)]">
                {organization.name || 'Add your organization'}
              </h3>
              <p className="text-[13px] text-[color:var(--text-muted)]">Used for orders and supplier communications.</p>
              <p className="text-[12px] text-[color:var(--text-muted)]">
                {organizationLogo ? organizationLogo.fileName : 'Add a logo to personalize your workspace.'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-[13px]" onClick={onEditOrganization}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </header>
        <dl className="grid gap-4 text-[13px] text-[color:var(--text-muted)] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[color:var(--text)]">Main contact person</dt>
            <dd>{organization.contactName || 'Add later'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">Phone</dt>
            <dd>{organization.phone || 'Add later'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">Organization email</dt>
            <dd>{organization.email || 'Add later'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">Business type</dt>
            <dd>{businessTypeOption?.label ?? 'Not specified'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[color:var(--text)]">VAT / Kennitala</dt>
            <dd>{organization.vat || 'Missing'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[color:var(--text)]">Delivery address</dt>
            <dd>
              {deliveryAddressText ? (
                <address className="not-italic whitespace-pre-line">{deliveryAddressText}</address>
              ) : (
                'Add later'
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[color:var(--text)]">Invoice address</dt>
            <dd>
              {organization.useSeparateInvoiceAddress ? (
                invoiceAddressText ? (
                  <address className="not-italic whitespace-pre-line">{invoiceAddressText}</address>
                ) : (
                  'Add later'
                )
              ) : deliveryAddressText ? (
                'Same as delivery address'
              ) : (
                'Add later'
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
              Suppliers
            </p>
            <h3 className="text-[17px] font-semibold text-[color:var(--text)]">
              {selectedSuppliers.length > 0
                ? `${selectedSuppliers.length} connected`
                : 'No suppliers connected yet'}
            </h3>
            <p className="text-[13px] text-[color:var(--text-muted)]">
              You can always add or remove suppliers later from Settings.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-[13px]" onClick={onEditSuppliers}>
            <Pencil className="h-4 w-4" /> Edit suppliers
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
            You haven’t connected any suppliers yet. We’ll remind you on the dashboard.
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/40 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-[color:var(--text-muted)]">
            <Languages className="h-4 w-4 text-[color:var(--brand-accent)]" /> Default language
          </label>
          <Select
            value={preferences.language}
            onValueChange={value => onPreferencesChange({ ...preferences, language: value })}
          >
            <SelectTrigger className="h-10 rounded-[10px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
              {LANGUAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-[13px]">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-[color:var(--text-muted)]">
            <Coins className="h-4 w-4 text-[color:var(--brand-accent)]" /> Default currency
          </label>
          <Select
            value={preferences.currency}
            onValueChange={value => onPreferencesChange({ ...preferences, currency: value })}
          >
            <SelectTrigger className="h-10 rounded-[10px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]">
              {CURRENCY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-[13px]">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-[color:var(--text-muted)]">We’ll use this for price displays and future reports.</p>
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
