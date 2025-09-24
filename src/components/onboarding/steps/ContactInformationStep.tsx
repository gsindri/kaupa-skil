import React, { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserCircle2, Mail, Phone } from 'lucide-react'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { getDefaultCountryCode, normalizePhoneInput } from '@/utils/phone'
import type { CountryCode } from 'libphonenumber-js'

const contactSchema = (country: CountryCode) => z.object({
  contactName: z
    .string()
    .trim()
    .min(2, '⚠ Please add a main contact person.'),
  email: z
    .string()
    .trim()
    .min(1, '⚠ Please add an email address.')
    .email('⚠ Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, '⚠ Please add a phone number.')
    .refine(value => normalizePhoneInput(value, country).isValid, {
      message: '⚠ Enter a valid international phone number.'
    })
})

export type ContactInformationFormValues = z.infer<ReturnType<typeof contactSchema>>

interface ContactInformationStepProps {
  value: ContactInformationFormValues
  onUpdate: (value: ContactInformationFormValues) => void
  onComplete: (value: ContactInformationFormValues) => void
  setupError?: string | null
}

export function ContactInformationStep({ 
  value, 
  onUpdate, 
  onComplete, 
  setupError 
}: ContactInformationStepProps) {
  const defaultCountry = useMemo(() => getDefaultCountryCode(), [])
  const schema = useMemo(() => contactSchema(defaultCountry), [defaultCountry])

  const form = useForm<ContactInformationFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: value
  })

  const commit = useCallback(() => {
    const current = form.getValues()
    onUpdate({
      contactName: current.contactName?.trim() || '',
      email: current.email?.trim() || '',
      phone: current.phone?.trim() || ''
    })
  }, [form, onUpdate])

  const handleSubmit = form.handleSubmit(async (data) => {
    const normalized = {
      contactName: data.contactName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim()
    }

    // Format phone number if valid
    const { formatted, isValid } = normalizePhoneInput(normalized.phone, defaultCountry)
    if (isValid && formatted !== normalized.phone) {
      normalized.phone = formatted
      form.setValue('phone', formatted, { shouldValidate: true, shouldDirty: true })
    }

    onUpdate(normalized)
    onComplete(normalized)
  })

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <UserCircle2 className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    Primary contact name
                    <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Jón Jónsson"
                    aria-required="true"
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const trimmed = event.target.value.trim()
                      form.setValue('contactName', trimmed, { shouldDirty: true, shouldValidate: true })
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
            name="email"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <Mail className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    Email address
                    <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="jon@example.com"
                    aria-required="true"
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const trimmed = event.target.value.trim()
                      form.setValue('email', trimmed, { shouldDirty: true, shouldValidate: true })
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
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <Phone className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    Phone number
                    <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+354 555 1234"
                    aria-required="true"
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const trimmed = event.target.value.trim()
                      form.setValue('phone', trimmed, { shouldDirty: true, shouldValidate: true })
                      commit()
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {setupError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {setupError}
        </div>
      )}
    </div>
  )
}