import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Info, Mail, MapPinHouse, Phone, Receipt, Store, UserCircle2 } from 'lucide-react'
import type { CountryCode } from 'libphonenumber-js'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getDefaultCountryCode, normalizePhoneInput, formatVat, isValidVat } from '@/utils/phone'

// eslint-disable-next-line react-refresh/only-export-components
export const BUSINESS_TYPE_VALUES = [
  'restaurant',
  'cafe',
  'hotel',
  'retail',
  'office',
  'catering',
  'other'
] as const

export type BusinessTypeValue = (typeof BUSINESS_TYPE_VALUES)[number]

// eslint-disable-next-line react-refresh/only-export-components
export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<{ value: BusinessTypeValue; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe / Bakery' },
  { value: 'hotel', label: 'Hotel / Accommodation' },
  { value: 'retail', label: 'Retail / Grocery' },
  { value: 'office', label: 'Office / Workplace' },
  { value: 'catering', label: 'Catering / Events' },
  { value: 'other', label: 'Other' }
]

const addressSchema = z.object({
  line1: z.string().trim().default(''),
  line2: z.string().trim().default(''),
  postalCode: z.string().trim().default(''),
  city: z.string().trim().default('')
})

type AddressFormValues = z.infer<typeof addressSchema>

const sanitizeAddress = (address?: Partial<AddressFormValues>): AddressFormValues => ({
  line1: address?.line1?.trim() ?? '',
  line2: address?.line2?.trim() ?? '',
  postalCode: address?.postalCode?.trim() ?? '',
  city: address?.city?.trim() ?? ''
})

const createOrganizationSchema = (country: CountryCode) =>
  z
    .object({
      name: z.string().trim().min(1, '⚠ Please enter an organization name.'),
      businessType: z.enum(BUSINESS_TYPE_VALUES).optional(),
      contactName: z
        .string()
        .trim()
        .min(2, '⚠ Please add a main contact person.'),
      phone: z
        .string()
        .trim()
        .min(1, '⚠ Please add a phone number.')
        .refine(value => normalizePhoneInput(value, country).isValid, {
          message: '⚠ Enter a valid international phone number.'
        }),
      deliveryAddress: addressSchema,
      vat: z
        .string()
        .trim()
        .min(1, '⚠ Please add VAT / Kennitala.')
        .refine(value => isValidVat(value), {
          message: '⚠ Use format ########-####.'
        }),
      email: z
        .string()
        .trim()
        .min(1, '⚠ Please add an email address.')
        .email('⚠ Enter a valid email address.'),
      useSeparateInvoiceAddress: z.boolean().default(false),
      invoiceAddress: addressSchema
    })
    .superRefine((data, ctx) => {
      const deliveryLine1 = data.deliveryAddress.line1.trim()
      if (deliveryLine1.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '⚠ Please add a street and house number.',
          path: ['deliveryAddress', 'line1']
        })
      }

      const deliveryPostal = data.deliveryAddress.postalCode.trim()
      if (deliveryPostal.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '⚠ Please add a postal code.',
          path: ['deliveryAddress', 'postalCode']
        })
      }

      const deliveryCity = data.deliveryAddress.city.trim()
      if (deliveryCity.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '⚠ Please add a city.',
          path: ['deliveryAddress', 'city']
        })
      }

      if (data.useSeparateInvoiceAddress) {
        const invoiceLine1 = data.invoiceAddress.line1.trim()
        if (invoiceLine1.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '⚠ Please add an invoice street address.',
            path: ['invoiceAddress', 'line1']
          })
        }

        const invoicePostal = data.invoiceAddress.postalCode.trim()
        if (invoicePostal.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '⚠ Please add an invoice postal code.',
            path: ['invoiceAddress', 'postalCode']
          })
        }

        const invoiceCity = data.invoiceAddress.city.trim()
        if (invoiceCity.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '⚠ Please add an invoice city.',
            path: ['invoiceAddress', 'city']
          })
        }
      }
    })

export type OrganizationFormValues = z.infer<ReturnType<typeof createOrganizationSchema>>

type SectionDefinition = {
  id: 'basics' | 'delivery' | 'invoicing' | 'contacts'
  title: string
  description: string
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Name your organization and categorize your business.'
  },
  {
    id: 'delivery',
    title: 'Delivery details',
    description: 'Tell us where orders should be delivered.'
  },
  {
    id: 'invoicing',
    title: 'Invoicing',
    description: 'Set invoice preferences and required tax details.'
  },
  {
    id: 'contacts',
    title: 'Contact info',
    description: 'Share who suppliers should reach out to.'
  }
]

type SectionId = SectionDefinition['id']
type OrganizationFieldPath = FieldPath<OrganizationFormValues>

const BASE_SECTION_VALIDATION: Record<SectionId, OrganizationFieldPath[]> = {
  basics: ['name'],
  delivery: ['deliveryAddress.line1', 'deliveryAddress.postalCode', 'deliveryAddress.city'],
  invoicing: ['vat'],
  contacts: ['contactName', 'email', 'phone']
}

export interface OrganizationStepFooterContext {
  isFirstSection: boolean
  isLastSection: boolean
  goToPrevious: () => void
}

export interface OrganizationStepProps {
  value: OrganizationFormValues
  onUpdate: (value: OrganizationFormValues) => void
  onComplete: (value: OrganizationFormValues) => void
  footer: React.ReactNode | ((context: OrganizationStepFooterContext) => React.ReactNode)
  setupError?: string | null
}

export interface OrganizationStepHandle {
  submit: () => Promise<boolean>
}

export const OrganizationStep = forwardRef<OrganizationStepHandle, OrganizationStepProps>(
  ({ value, onUpdate, onComplete, footer, setupError }, ref) => {
    const [sectionIndex, setSectionIndex] = useState(0)
    const currentSection = SECTION_DEFINITIONS[sectionIndex]
    const progress = ((sectionIndex + 1) / SECTION_DEFINITIONS.length) * 100

    const defaultCountry = useMemo(() => getDefaultCountryCode(), [])
    const schema = useMemo(() => createOrganizationSchema(defaultCountry), [defaultCountry])

    const form = useForm<OrganizationFormValues>({
      resolver: zodResolver(schema),
      mode: 'onBlur',
      defaultValues: value
    })

    const useSeparateInvoiceAddress = form.watch('useSeparateInvoiceAddress')

    useEffect(() => {
      form.reset(value)
    }, [value, form])

    const commit = useCallback(() => {
      const current = form.getValues()
      const deliveryAddress = sanitizeAddress(current.deliveryAddress)
      const invoiceAddress = sanitizeAddress(current.invoiceAddress)

      onUpdate({
        name: current.name?.trim() || '',
        businessType: current.businessType || undefined,
        contactName: current.contactName?.trim() || '',
        phone: current.phone?.trim() || '',
        deliveryAddress,
        vat: current.vat ? formatVat(current.vat) : '',
        email: current.email?.trim() || '',
        useSeparateInvoiceAddress: Boolean(current.useSeparateInvoiceAddress),
        invoiceAddress
      })
    }, [form, onUpdate])

    const goToPrevious = useCallback(() => {
      if (sectionIndex === 0) {
        return
      }
      commit()
      setSectionIndex(prev => Math.max(0, prev - 1))
    }, [commit, sectionIndex])

    const goToSection = useCallback(
      (targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= SECTION_DEFINITIONS.length) {
          return
        }
        commit()
        setSectionIndex(targetIndex)
      },
      [commit]
    )

    const validateCurrentSection = useCallback(async () => {
      const sectionId = SECTION_DEFINITIONS[sectionIndex].id
      const baseFields = BASE_SECTION_VALIDATION[sectionId] || []

      let fields: OrganizationFieldPath[] = baseFields

      if (sectionId === 'invoicing') {
        const shouldUseSeparate = form.getValues('useSeparateInvoiceAddress')
        fields = shouldUseSeparate
          ? [
              'useSeparateInvoiceAddress',
              'invoiceAddress.line1',
              'invoiceAddress.postalCode',
              'invoiceAddress.city',
              'vat'
            ]
          : ['useSeparateInvoiceAddress', 'vat']
      }

      const isValid = await form.trigger(fields, {
        shouldFocus: true
      })

      if (!isValid) {
        return false
      }

      commit()
      return true
    }, [commit, form, sectionIndex])

    const handleSubmit = form.handleSubmit(async data => {
      const normalized = { ...data }

      normalized.name = normalized.name.trim()
      normalized.businessType = normalized.businessType || undefined
      normalized.contactName = normalized.contactName.trim()
      normalized.phone = normalized.phone.trim()
      normalized.email = normalized.email.trim()
      normalized.deliveryAddress = sanitizeAddress(normalized.deliveryAddress)
      normalized.invoiceAddress = sanitizeAddress(normalized.invoiceAddress)

      normalized.vat = formatVat(normalized.vat)

      const { formatted, isValid } = normalizePhoneInput(normalized.phone, defaultCountry)
      if (isValid && formatted !== normalized.phone) {
        normalized.phone = formatted
        form.setValue('phone', formatted, { shouldValidate: true, shouldDirty: true })
      }

      onUpdate(normalized)
      onComplete(normalized)
    })

    const submit = useCallback(async () => {
      const isValid = await validateCurrentSection()
      if (!isValid) {
        return false
      }

      if (sectionIndex < SECTION_DEFINITIONS.length - 1) {
        setSectionIndex(prev => Math.min(prev + 1, SECTION_DEFINITIONS.length - 1))
        return false
      }

      await handleSubmit()
      return true
    }, [handleSubmit, sectionIndex, validateCurrentSection])

    useImperativeHandle(
      ref,
      () => ({
        submit
      }),
      [submit]
    )

    const onFormSubmit = useCallback(
      (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void submit()
      },
      [submit]
    )

    const handleStepClick = useCallback(
      (index: number) => {
        if (index >= sectionIndex) {
          return
        }
        goToSection(index)
      },
      [goToSection, sectionIndex]
    )

    const isFirstSection = sectionIndex === 0
    const isLastSection = sectionIndex === SECTION_DEFINITIONS.length - 1

    const renderedFooter = useMemo(() => {
      if (typeof footer === 'function') {
        return footer({
          isFirstSection,
          isLastSection,
          goToPrevious
        })
      }
      return footer
    }, [footer, goToPrevious, isFirstSection, isLastSection])

    const sectionContent = useMemo(() => {
      switch (currentSection.id) {
        case 'basics':
          return (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                          <span className="flex items-center gap-1">
                            Organization name
                            <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                              *
                            </span>
                          </span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="e.g. Reykjavík Restaurant Group"
                        required
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const trimmed = event.target.value.trim()
                          form.setValue('name', trimmed, { shouldDirty: true, shouldValidate: true })
                          commit()
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                          Business type <span className="text-[12px] text-[color:var(--text-muted)]">(optional)</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={value => {
                        if (value === '__none__') {
                          field.onChange(undefined)
                          commit()
                          return
                        }
                        field.onChange(value as BusinessTypeValue)
                        commit()
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-left text-[13px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-[12px] border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] text-[13px]">
                        <SelectItem value="__none__" className="text-[13px] text-[color:var(--text-muted)]">
                          Not specified
                        </SelectItem>
                        {BUSINESS_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-[13px]">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )
        case 'delivery':
          return (
            <div className="space-y-6">
              <div className="flex items-start gap-2">
                <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)]" />
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-[color:var(--text)]">
                    <span className="flex items-center gap-1">
                      Delivery address
                      <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                        *
                      </span>
                    </span>
                  </p>
                  <p className="text-[12px] text-[color:var(--text-muted)]">
                    This is where suppliers will send orders.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="deliveryAddress.line1"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          Street &amp; house number
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Sæbraut 31"
                          autoComplete="shipping street-address"
                          required
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('deliveryAddress.line1', trimmed, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                            commit()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress.line2"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                        Additional details <span className="text-[12px] text-[color:var(--text-muted)]">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Floor, entrance, instructions"
                          autoComplete="shipping address-line2"
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('deliveryAddress.line2', trimmed, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                            commit()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress.postalCode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          Postal code
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 101"
                          inputMode="numeric"
                          autoComplete="shipping postal-code"
                          required
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('deliveryAddress.postalCode', trimmed, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                            commit()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress.city"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          City
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Reykjavík"
                          autoComplete="shipping address-level2"
                          required
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('deliveryAddress.city', trimmed, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                            commit()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )
        case 'invoicing':
          return (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="useSeparateInvoiceAddress"
                render={({ field }) => {
                  const invoicesUseDelivery = !field.value
                  return (
                    <FormItem className="space-y-2">
                      <div className="flex items-start gap-3 rounded-[12px] border border-[color:var(--surface-ring)]/70 bg-[color:var(--surface-pop-2)]/40 p-3">
                        <Checkbox
                          id="invoicesUseDelivery"
                          checked={invoicesUseDelivery}
                          onCheckedChange={checked => {
                            const useDelivery = Boolean(checked)
                            field.onChange(!useDelivery)
                            if (useDelivery) {
                              form.clearErrors('invoiceAddress')
                            }
                            commit()
                          }}
                          className="mt-1"
                        />
                        <label htmlFor="invoicesUseDelivery" className="text-[13px] font-semibold text-[color:var(--text)]">
                          Use delivery address for invoices
                        </label>
                      </div>
                    </FormItem>
                  )
                }}
              />

              {useSeparateInvoiceAddress && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)]" />
                    <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          Invoice address
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </p>
                      <p className="text-[12px] text-[color:var(--text-muted)]">
                        Where finance teams should send paperwork.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="invoiceAddress.line1"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                            <span className="flex items-center gap-1">
                              Street &amp; house number
                              <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                                *
                              </span>
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Borgartún 21"
                              autoComplete="billing street-address"
                              required
                              {...field}
                              onBlur={event => {
                                field.onBlur()
                                const trimmed = event.target.value.trim()
                                form.setValue('invoiceAddress.line1', trimmed, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                                commit()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceAddress.line2"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                            Additional details <span className="text-[12px] text-[color:var(--text-muted)]">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Billing notes"
                              autoComplete="billing address-line2"
                              {...field}
                              onBlur={event => {
                                field.onBlur()
                                const trimmed = event.target.value.trim()
                                form.setValue('invoiceAddress.line2', trimmed, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                                commit()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceAddress.postalCode"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                            <span className="flex items-center gap-1">
                              Postal code
                              <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                                *
                              </span>
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 105"
                              inputMode="numeric"
                              autoComplete="billing postal-code"
                              required
                              {...field}
                              onBlur={event => {
                                field.onBlur()
                                const trimmed = event.target.value.trim()
                                form.setValue('invoiceAddress.postalCode', trimmed, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                                commit()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceAddress.city"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                            <span className="flex items-center gap-1">
                              City
                              <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                                *
                              </span>
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Reykjavík"
                              autoComplete="billing address-level2"
                              required
                              {...field}
                              onBlur={event => {
                                field.onBlur()
                                const trimmed = event.target.value.trim()
                                form.setValue('invoiceAddress.city', trimmed, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                                commit()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="vat"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <Receipt className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                            <span className="flex items-center gap-1">
                              VAT / Kennitala
                              <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                                *
                              </span>
                            </span>
                          </FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
                                aria-label="Why we ask for VAT or Kennitala"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px] rounded-[12px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-3 py-2 text-left text-[12px] leading-relaxed text-[color:var(--text-muted)]">
                              Used to pre-fill invoices and receipts.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="########-####"
                        required
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const formatted = formatVat(event.target.value)
                          form.setValue('vat', formatted, { shouldDirty: true })
                          commit()
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )
        case 'contacts':
          return (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <UserCircle2 className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                          <span className="flex items-center gap-1">
                            Main contact person
                            <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                              *
                            </span>
                          </span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="Who should suppliers talk to?"
                        required
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          commit()
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                          <span className="flex items-center gap-1">
                            Organization email
                            <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                              *
                            </span>
                          </span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="orders@yourbusiness.is"
                        required
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const trimmed = event.target.value.trim()
                          form.setValue('email', trimmed, { shouldValidate: true, shouldDirty: true })
                          commit()
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="group space-y-2">
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <div className="space-y-1">
                        <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                          <span className="flex items-center gap-1">
                            Phone
                            <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                              *
                            </span>
                          </span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="+354 555 1234"
                        required
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const { formatted, isValid } = normalizePhoneInput(event.target.value, defaultCountry)
                          if (isValid && formatted !== event.target.value) {
                            form.setValue('phone', formatted, { shouldValidate: true, shouldDirty: true })
                          }
                          commit()
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )
        default:
          return null
      }
    }, [commit, currentSection.id, defaultCountry, form, useSeparateInvoiceAddress])

    return (
      <div className="space-y-6">
        {setupError && (
          <Alert variant="destructive">
            <AlertTitle>We couldn’t create that workspace</AlertTitle>
            <AlertDescription>{setupError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form className="flex flex-col gap-8" onSubmit={onFormSubmit}>
            <div className="space-y-4 rounded-[16px] border border-[color:var(--surface-ring)]/60 bg-[color:var(--surface-pop)]/40 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Step {sectionIndex + 1} of {SECTION_DEFINITIONS.length}
                  </p>
                  <h3 className="text-[18px] font-semibold text-[color:var(--text)]">
                    {currentSection.title}
                  </h3>
                  <p className="text-[13px] text-[color:var(--text-muted)]">{currentSection.description}</p>
                </div>
                <ol className="flex items-center gap-2 text-[12px] text-[color:var(--text-muted)]">
                  {SECTION_DEFINITIONS.map((section, index) => {
                    const status =
                      index === sectionIndex
                        ? 'current'
                        : index < sectionIndex
                          ? 'complete'
                          : 'upcoming'
                    return (
                      <li key={section.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStepClick(index)}
                          disabled={index > sectionIndex}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2',
                            status === 'complete' &&
                              'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)]',
                            status === 'current' && 'border-[var(--brand-accent)] text-[var(--brand-accent)]',
                            status === 'upcoming' && 'border-[color:var(--surface-ring)]'
                          )}
                          aria-current={status === 'current' ? 'step' : undefined}
                          aria-label={`Step ${index + 1}: ${section.title}`}
                        >
                          {status === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
                        </button>
                        <span
                          className={cn(
                            'hidden text-[12px] sm:inline',
                            status === 'current' && 'font-medium text-[color:var(--text)]',
                            status === 'complete' && 'text-[var(--brand-accent)]'
                          )}
                        >
                          {section.title}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
              <div className="h-1 w-full rounded-full bg-[color:var(--surface-ring)]/40">
                <div
                  className="h-full rounded-full bg-[var(--brand-accent)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {sectionContent}

            <div className="border-t border-[color:var(--surface-ring)]/80 pt-6">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {renderedFooter}
              </div>
            </div>
          </form>
        </Form>
      </div>
    )
  }
)

OrganizationStep.displayName = 'OrganizationStep'
