import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, UserCircle2, Phone, MapPinHouse, Receipt, Info } from 'lucide-react'
import type { CountryCode } from 'libphonenumber-js'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { getDefaultCountryCode, normalizePhoneInput, formatVat, isValidVat } from '@/utils/phone'

const createOrganizationSchema = (country: CountryCode) =>
  z.object({
    name: z.string().trim().min(1, '⚠ Please enter an organization name.'),
    contactName: z
      .string()
      .trim()
      .min(2, '⚠ Please add a primary contact name.'),
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
      .min(5, '⚠ Please add your business address.'),
    vat: z
      .string()
      .trim()
      .optional()
      .refine(value => isValidVat(value), {
        message: '⚠ Use format ########-####.'
      })
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

    useEffect(() => {
      form.reset(value)
    }, [value, form])

    const commit = () => {
      const current = form.getValues()
      onUpdate({
        name: current.name?.trim() || '',
        contactName: current.contactName?.trim() || '',
        phone: current.phone?.trim() || '',
        address: current.address?.trim() || '',
        vat: current.vat ? formatVat(current.vat) : current.vat
      })
    }

    const handleSubmit = form.handleSubmit(async data => {
      const normalized = { ...data }
      if (normalized.vat) {
        normalized.vat = formatVat(normalized.vat)
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
            className="space-y-8"
            onSubmit={event => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Contact information</h3>
                <p className="text-[13px] text-[color:var(--text-muted)]">Let suppliers know who to reach.</p>
              </div>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 text-[13px] text-[color:var(--text-muted)]">
                        <Building2 className="h-5 w-5 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                        <span className="flex items-center gap-1">
                          Organization name
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 text-[13px] text-[color:var(--text-muted)]">
                        <UserCircle2 className="h-5 w-5 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                        <span className="flex items-center gap-1">
                          Primary contact
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Primary contact person"
                          required
                          {...field}
                          onBlur={event => {
                            field.onBlur()
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 text-[13px] text-[color:var(--text-muted)]">
                        <Phone className="h-5 w-5 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                        <span className="flex items-center gap-1">
                          Phone
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator className="bg-[color:var(--surface-ring)]/80" />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[13px] font-semibold text-[color:var(--text)]">Business details</h3>
                <p className="text-[13px] text-[color:var(--text-muted)]">Tell us where deliveries and invoices go.</p>
              </div>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 text-[13px] text-[color:var(--text-muted)]">
                        <MapPinHouse className="h-5 w-5 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                        <span className="flex items-center gap-1">
                          Business address
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vat"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="flex items-center gap-2 text-[13px] text-[color:var(--text-muted)]">
                        <Receipt className="h-5 w-5 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                        VAT / Kennitala (optional)
                      </FormLabel>
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
                      <p className="flex items-center gap-2 text-[12px] text-[color:var(--text-muted)]">
                        <Info className="h-4 w-4 text-[color:var(--text-muted)]" />
                        Used to pre-fill invoices and receipts.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          </form>
        </Form>
        {footer}
      </div>
    )
  }
)

OrganizationStep.displayName = 'OrganizationStep'
