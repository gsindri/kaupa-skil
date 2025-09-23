import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPinHouse } from 'lucide-react'

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
}).superRefine((data, ctx) => {
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
  const form = useForm<DeliveryDetailsFormValues>({
    resolver: zodResolver(deliverySchema),
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
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[color:var(--text)]">Delivery details</h2>
        <p className="text-sm text-[color:var(--text-muted)]">
          Tell us where orders should be delivered.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="deliveryAddress.line1"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <div className="flex items-start gap-2">
                  <MapPinHouse className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <div className="space-y-1">
                    <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                      <span className="flex items-center gap-1">
                        Street address
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
                    placeholder="e.g. Laugavegur 26"
                    required
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const trimmed = event.target.value.trim()
                      form.setValue('deliveryAddress.line1', trimmed, { shouldDirty: true, shouldValidate: true })
                      commit()
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryAddress.line2"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                  Apartment, suite, etc. <span className="text-[12px] text-[color:var(--text-muted)]">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Suite 3B"
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deliveryAddress.postalCode"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
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
                      required
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
                      City
                      <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">
                        *
                      </span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Reykjavík"
                      required
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