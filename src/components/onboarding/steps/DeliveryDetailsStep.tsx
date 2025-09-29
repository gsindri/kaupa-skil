import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPinHouse } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const addressSchema = z.object({
  line1: z.string().trim().default(''),
  line2: z.string().trim().default(''),
  postalCode: z.string().trim().default(''),
  city: z.string().trim().default('')
})

const deliverySchema = z.object({
  deliveryAddress: addressSchema
})

export type DeliveryDetailsFormValues = z.infer<typeof deliverySchema>

const sanitizeAddress = (address?: Partial<DeliveryDetailsFormValues['deliveryAddress']>) => ({
  line1: address?.line1?.trim() ?? '',
  line2: address?.line2?.trim() ?? '',
  postalCode: address?.postalCode?.trim() ?? '',
  city: address?.city?.trim() ?? ''
})

interface DeliveryDetailsStepProps {
  value: DeliveryDetailsFormValues
  onUpdate: (value: DeliveryDetailsFormValues) => void
  onComplete: (value: DeliveryDetailsFormValues) => void
  setupError?: string | null
}

export function DeliveryDetailsStep({
  value,
  onUpdate,
  onComplete,
  setupError
}: DeliveryDetailsStepProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'onboarding.steps.deliveryDetails' })
  const schema = React.useMemo(
    () =>
      deliverySchema.superRefine((data, ctx) => {
        const deliveryLine1 = data.deliveryAddress.line1.trim()
        if (deliveryLine1.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.street'),
            path: ['deliveryAddress', 'line1']
          })
        }

        const deliveryPostal = data.deliveryAddress.postalCode.trim()
        if (deliveryPostal.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.postal'),
            path: ['deliveryAddress', 'postalCode']
          })
        }

        const deliveryCity = data.deliveryAddress.city.trim()
        if (deliveryCity.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.city'),
            path: ['deliveryAddress', 'city']
          })
        }
      }),
    [t]
  )
  const form = useForm<DeliveryDetailsFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: value
  })

  const commit = useCallback(() => {
    const current = form.getValues()
    onUpdate({
      deliveryAddress: sanitizeAddress(current.deliveryAddress)
    })
  }, [form, onUpdate])

  const handleSubmit = form.handleSubmit(async (data) => {
    const normalized = {
      deliveryAddress: sanitizeAddress(data.deliveryAddress)
    }
    
    onUpdate(normalized)
    onComplete(normalized)
  })

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="deliveryAddress.line1"
              render={({ field }) => (
                <FormItem className="group space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                    <MapPinHouse
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]"
                    />
                    <span className="flex items-center gap-1">
                      {t('form.street.label')}
                      <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                        *
                      </span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.street.placeholder')}
                      aria-required="true"
                      {...field}
                      onBlur={event => {
                        field.onBlur()
                        const trimmed = event.target.value.trim()
                        form.setValue('deliveryAddress.line1', trimmed, { shouldDirty: true, shouldValidate: true })
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
                  <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                    {t('form.addressLine2.label')} {' '}
                    <span className="text-[12px] font-normal text-[color:var(--text-muted)]">{t('form.optional')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.addressLine2.placeholder')}
                      {...field}
                      onBlur={event => {
                        field.onBlur()
                        const trimmed = event.target.value.trim()
                        form.setValue('deliveryAddress.line2', trimmed, { shouldDirty: true })
                        commit()
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="deliveryAddress.postalCode"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                    <span className="flex items-center gap-1">
                      {t('form.postal.label')}
                      <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                        *
                      </span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.postal.placeholder')}
                      aria-required="true"
                      {...field}
                      onBlur={event => {
                        field.onBlur()
                        const trimmed = event.target.value.trim()
                        form.setValue('deliveryAddress.postalCode', trimmed, { shouldDirty: true, shouldValidate: true })
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
                  <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                    <span className="flex items-center gap-1">
                      {t('form.city.label')}
                      <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                        *
                      </span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.city.placeholder')}
                      aria-required="true"
                      {...field}
                      onBlur={event => {
                        field.onBlur()
                        const trimmed = event.target.value.trim()
                        form.setValue('deliveryAddress.city', trimmed, { shouldDirty: true, shouldValidate: true })
                        commit()
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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