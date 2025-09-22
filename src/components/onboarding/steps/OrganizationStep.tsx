import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, UserCircle2, Phone, MapPinHouse, Receipt, Info, ChevronDown, Mail } from 'lucide-react'
import type { CountryCode } from 'libphonenumber-js'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getDefaultCountryCode, normalizePhoneInput, formatVat, isValidVat } from '@/utils/phone'

const createOrganizationSchema = (country: CountryCode) =>
  z
    .object({
      name: z.string().trim().min(1, '⚠ Please enter an organization name.'),
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
      address: z
        .string()
        .trim()
        .min(5, '⚠ Please add your delivery address.'),
      vat: z
        .string()
        .trim()
        .optional()
        .refine(value => isValidVat(value), {
          message: '⚠ Use format ########-####.'
        }),
      email: z
        .string()
        .trim()
        .email('⚠ Enter a valid email address.')
        .or(z.literal('')),
      useSeparateInvoiceAddress: z.boolean().default(false),
      invoiceAddress: z.string().trim().optional()
    })
    .superRefine((data, ctx) => {
      if (data.useSeparateInvoiceAddress) {
        const invoice = data.invoiceAddress?.trim() ?? ''
        if (invoice.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '⚠ Please add your invoice address.',
            path: ['invoiceAddress']
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

    const [detailsOpen, setDetailsOpen] = useState(Boolean(value.vat))
    const vatError = form.formState.errors.vat
    const useSeparateInvoiceAddress = form.watch('useSeparateInvoiceAddress')

    useEffect(() => {
      form.reset(value)
    }, [value, form])

    useEffect(() => {
      if (value.vat) {
        setDetailsOpen(true)
      }
    }, [value.vat])

    useEffect(() => {
      if (vatError) {
        setDetailsOpen(true)
      }
    }, [vatError])

    const commit = () => {
      const current = form.getValues()
      onUpdate({
        name: current.name?.trim() || '',
        contactName: current.contactName?.trim() || '',
        phone: current.phone?.trim() || '',
        address: current.address?.trim() || '',
        vat: current.vat ? formatVat(current.vat) : '',
        email: current.email?.trim() || '',
        useSeparateInvoiceAddress: Boolean(current.useSeparateInvoiceAddress),
        invoiceAddress:
          current.useSeparateInvoiceAddress && current.invoiceAddress
            ? current.invoiceAddress.trim()
            : ''
      })
    }

    const handleSubmit = form.handleSubmit(async data => {
      const normalized = { ...data }

      normalized.name = normalized.name.trim()
      normalized.contactName = normalized.contactName.trim()
      normalized.address = normalized.address.trim()
      normalized.phone = normalized.phone.trim()
      normalized.email = normalized.email?.trim() ?? ''

      if (normalized.vat) {
        normalized.vat = formatVat(normalized.vat)
      } else {
        normalized.vat = ''
      }

      if (normalized.useSeparateInvoiceAddress) {
        normalized.invoiceAddress = normalized.invoiceAddress?.trim() ?? ''
      } else {
        normalized.invoiceAddress = ''
      }

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
                <div className="space-y-1">
                  <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Business details</h3>
                  <p className="text-[13px] text-[color:var(--text-muted)]">Tell us about your organization.</p>
                </div>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="group space-y-2">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
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
                              commit()
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="group space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                          <div className="space-y-1">
                            <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                              <span className="flex items-center gap-1">
                                Delivery &amp; invoice address
                                <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                                  *
                                </span>
                              </span>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Street, city, postcode"
                            rows={3}
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
                    name="useSeparateInvoiceAddress"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-start gap-3 rounded-[12px] border border-[color:var(--surface-ring)]/70 bg-[color:var(--surface-pop-2)]/40 p-3">
                          <Checkbox
                            id="useSeparateInvoiceAddress"
                            checked={field.value}
                            onCheckedChange={checked => {
                              const value = Boolean(checked)
                              field.onChange(value)
                              if (!value) {
                                form.setValue('invoiceAddress', '', {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                                form.clearErrors('invoiceAddress')
                              }
                              commit()
                            }}
                            className="mt-1"
                          />
                          <div className="space-y-1 text-left">
                            <label
                              htmlFor="useSeparateInvoiceAddress"
                              className="text-[13px] font-semibold text-[color:var(--text)]"
                            >
                              Use a different invoice address
                            </label>
                            <p className="text-[12px] text-[color:var(--text-muted)]">
                              Leave unchecked if deliveries and invoices share the same address.
                            </p>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  {useSeparateInvoiceAddress && (
                    <FormField
                      control={form.control}
                      name="invoiceAddress"
                      render={({ field }) => (
                        <FormItem className="group space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                            <div className="space-y-1">
                              <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                                Invoice address
                                <span aria-hidden="true" className="ml-1 text-[color:var(--brand-accent)] opacity-80">
                                  *
                                </span>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Finance office, street, city, postcode"
                              rows={3}
                              {...field}
                              onBlur={event => {
                                field.onBlur()
                                const trimmed = event.target.value.trim()
                                form.setValue('invoiceAddress', trimmed, {
                                  shouldValidate: true,
                                  shouldDirty: true
                                })
                                commit()
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </section>

              <Separator className="bg-[color:var(--surface-ring)]/80 lg:hidden" />
              <div className="hidden h-full w-px bg-[color:var(--surface-ring)]/70 lg:block" aria-hidden="true" />

              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Contact information</h3>
                  <p className="text-[13px] text-[color:var(--text-muted)]">Let suppliers know who to reach.</p>
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
                              Organization email (optional)
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            type="email"
                            inputMode="email"
                            placeholder="orders@yourbusiness.is"
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

                  <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <CollapsibleTrigger
                      type="button"
                      className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:underline"
                    >
                      <span>More details (optional)</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-3">
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
                                    VAT / Kennitala (optional)
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
                    </CollapsibleContent>
                  </Collapsible>
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
