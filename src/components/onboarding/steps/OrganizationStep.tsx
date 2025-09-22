import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, UserCircle2, Phone, MapPinHouse, Receipt, Info, Mail, Store } from 'lucide-react'
import type { CountryCode } from 'libphonenumber-js'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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

export interface OrganizationStepProps {
  value: OrganizationFormValues
  onUpdate: (value: OrganizationFormValues) => void
  onComplete: (value: OrganizationFormValues) => void
  footer: React.ReactNode
  setupError?: string | null
}

export interface OrganizationStepHandle {
  submit: () => Promise<boolean>
}

export const OrganizationStep = forwardRef<OrganizationStepHandle, OrganizationStepProps>(
  ({ value, onUpdate, onComplete, footer, setupError }, ref) => {
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

    const commit = () => {
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
    }

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

    useImperativeHandle(
      ref,
      () => ({
        submit: async () => {
          const valid = await form.trigger()
          if (!valid) {
            return false
          }
          await handleSubmit()
          return true
        }
      }),
      [form, handleSubmit]
    )

    return (
      <div className="space-y-6">
        {setupError && (
          <Alert variant="destructive">
            <AlertTitle>We couldn’t create that workspace</AlertTitle>
            <AlertDescription>{setupError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            className="flex flex-col gap-8"
            onSubmit={event => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start lg:gap-10">
              <section className="space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Business details</h3>
                </div>
                <div className="grid gap-4">
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
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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

                  <div className="group space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <p className="text-[13px] font-semibold text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          Delivery address
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                        </span>
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="deliveryAddress.line1"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                              <span className="flex items-center gap-1">
                                Street &amp; house number
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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
                            <label
                              htmlFor="invoicesUseDelivery"
                              className="text-[13px] font-semibold text-[color:var(--text)]"
                            >
                              Send invoices to the delivery address.
                            </label>
                          </div>
                        </FormItem>
                      )
                    }}
                  />

                  <div className="group space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                      <p className="text-[13px] font-semibold text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          Invoice address
                          {useSeparateInvoiceAddress && (
                            <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                          )}
                        </span>
                      </p>
                    </div>

                    {useSeparateInvoiceAddress ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="invoiceAddress.line1"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                                <span className="flex items-center gap-1">
                                  Street &amp; house number
                                  <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                                </span>
                              </FormLabel>
                              <FormControl>
                              <Input
                                placeholder="e.g. Tryggvagata 11"
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
                                  placeholder="Department, floor, instructions"
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
                                  <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                                </span>
                              </FormLabel>
                              <FormControl>
                              <Input
                                placeholder="e.g. 210"
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
                                  <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                                </span>
                              </FormLabel>
                              <FormControl>
                              <Input
                                placeholder="e.g. Hafnarfjörður"
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
                    ) : (
                      <div className="rounded-[12px] border border-dashed border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/30 px-4 py-3 text-[12px] text-[color:var(--text-muted)]">
                        Invoices will use the delivery address above.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <Separator className="bg-[color:var(--surface-ring)]/80 lg:hidden" />
              <div className="hidden h-full w-px bg-[color:var(--surface-ring)]/70 lg:block" aria-hidden="true" />

              <section className="space-y-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Contact information</h3>
                </div>
                <div className="space-y-4">
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
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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
                                  <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
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
                              form.setValue('vat', formatted)
                              commit()
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            </div>
            <div className="border-t border-[color:var(--surface-ring)]/80 pt-6">
              <div className="flex w-full flex-col items-center gap-2 sm:items-end">
                {footer}
              </div>
            </div>
          </form>
        </Form>
      </div>
    )
  }
)

OrganizationStep.displayName = 'OrganizationStep'
