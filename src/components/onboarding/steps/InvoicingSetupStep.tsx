import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt, MapPinHouse } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { formatVat, isValidVat } from '@/utils/phone'

const addressSchema = z.object({
  line1: z.string().trim().default(''),
  line2: z.string().trim().default(''),
  postalCode: z.string().trim().default(''),
  city: z.string().trim().default('')
})

const baseInvoicingSchema = z.object({
  vat: z.string().trim(),
  useSeparateInvoiceAddress: z.boolean().default(false),
  invoiceAddress: addressSchema
})

export type InvoicingSetupFormValues = z.infer<typeof baseInvoicingSchema>

const sanitizeAddress = (address?: Partial<InvoicingSetupFormValues['invoiceAddress']>) => ({
  line1: address?.line1?.trim() ?? '',
  line2: address?.line2?.trim() ?? '',
  postalCode: address?.postalCode?.trim() ?? '',
  city: address?.city?.trim() ?? ''
})

interface InvoicingSetupStepProps {
  value: InvoicingSetupFormValues
  onUpdate: (value: InvoicingSetupFormValues) => void
  onComplete: (value: InvoicingSetupFormValues) => void
  setupError?: string | null
}

export function InvoicingSetupStep({
  value,
  onUpdate,
  onComplete,
  setupError
}: InvoicingSetupStepProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'onboarding.steps.invoicingSetup' })
  const schema = React.useMemo(
    () =>
      z
        .object({
          vat: z
            .string()
            .trim()
            .min(1, t('validation.vat.required'))
            .refine(value => isValidVat(value), {
              message: t('validation.vat.format')
            }),
          useSeparateInvoiceAddress: z.boolean().default(false),
          invoiceAddress: addressSchema
        })
        .superRefine((data, ctx) => {
          if (data.useSeparateInvoiceAddress) {
            const invoiceLine1 = data.invoiceAddress.line1.trim()
            if (invoiceLine1.length < 5) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.invoiceAddress.street'),
                path: ['invoiceAddress', 'line1']
              })
            }

            const invoicePostal = data.invoiceAddress.postalCode.trim()
            if (invoicePostal.length < 2) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.invoiceAddress.postal'),
                path: ['invoiceAddress', 'postalCode']
              })
            }

            const invoiceCity = data.invoiceAddress.city.trim()
            if (invoiceCity.length < 2) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.invoiceAddress.city'),
                path: ['invoiceAddress', 'city']
              })
            }
          }
        }),
    [t]
  )
  const form = useForm<InvoicingSetupFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: value
  })

  const useSeparateInvoiceAddress = form.watch('useSeparateInvoiceAddress')

  const commit = useCallback(() => {
    const current = form.getValues()
    onUpdate({
      vat: current.vat ? formatVat(current.vat) : '',
      useSeparateInvoiceAddress: Boolean(current.useSeparateInvoiceAddress),
      invoiceAddress: sanitizeAddress(current.invoiceAddress)
    })
  }, [form, onUpdate])

  const handleSubmit = form.handleSubmit(async (data) => {
    const normalized = {
      vat: formatVat(data.vat),
      useSeparateInvoiceAddress: Boolean(data.useSeparateInvoiceAddress),
      invoiceAddress: sanitizeAddress(data.invoiceAddress)
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
            name="vat"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <Receipt className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    {t('form.vat.label')}
                    <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.vat.placeholder')}
                    aria-required="true"
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const formatted = formatVat(event.target.value)
                      form.setValue('vat', formatted, { shouldDirty: true, shouldValidate: true })
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
            name="useSeparateInvoiceAddress"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={checked => {
                      field.onChange(checked)
                      commit()
                    }}
                    className="h-5 w-5 rounded-md border-[color:var(--surface-ring)] data-[state=checked]:bg-[color:var(--brand-accent)] data-[state=checked]:border-[color:var(--brand-accent)]"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[13px] font-medium text-[color:var(--text)]">
                    {t('form.useSeparate.label')}
                  </FormLabel>
                  <p className="text-[12px] text-[color:var(--text-muted)]">
                    {t('form.useSeparate.description')}
                  </p>
                </div>
              </FormItem>
            )}
          />

          {useSeparateInvoiceAddress && (
            <div className="space-y-4 rounded-lg border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] p-4">
              <div className="flex items-center gap-2">
                <MapPinHouse className="h-4 w-4 text-[color:var(--text-muted)]" />
                <h3 className="text-sm font-semibold text-[color:var(--text)]">{t('form.invoiceSection.title')}</h3>
              </div>

              <FormField
                control={form.control}
                name="invoiceAddress.line1"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                      <span className="flex items-center gap-1">
                        {t('form.invoiceAddress.street.label')}
                        <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                          *
                        </span>
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.invoiceAddress.street.placeholder')}
                        aria-required={useSeparateInvoiceAddress || undefined}
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const trimmed = event.target.value.trim()
                          form.setValue('invoiceAddress.line1', trimmed, { shouldDirty: true, shouldValidate: true })
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
                    <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                      {t('form.invoiceAddress.line2.label')} {' '}
                      <span className="text-[12px] font-normal text-[color:var(--text-muted)]">{t('form.optional')}</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.invoiceAddress.line2.placeholder')}
                        {...field}
                        onBlur={event => {
                          field.onBlur()
                          const trimmed = event.target.value.trim()
                          form.setValue('invoiceAddress.line2', trimmed, { shouldDirty: true })
                          commit()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceAddress.postalCode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          {t('form.invoiceAddress.postal.label')}
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('form.invoiceAddress.postal.placeholder')}
                          aria-required={useSeparateInvoiceAddress || undefined}
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('invoiceAddress.postalCode', trimmed, { shouldDirty: true, shouldValidate: true })
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
                      <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                        <span className="flex items-center gap-1">
                          {t('form.invoiceAddress.city.label')}
                          <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                            *
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('form.invoiceAddress.city.placeholder')}
                          aria-required={useSeparateInvoiceAddress || undefined}
                          {...field}
                          onBlur={event => {
                            field.onBlur()
                            const trimmed = event.target.value.trim()
                            form.setValue('invoiceAddress.city', trimmed, { shouldDirty: true, shouldValidate: true })
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