import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Store } from 'lucide-react'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

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

export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<{ value: BusinessTypeValue; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe / Bakery' },
  { value: 'hotel', label: 'Hotel / Accommodation' },
  { value: 'retail', label: 'Retail / Grocery' },
  { value: 'office', label: 'Office / Workplace' },
  { value: 'catering', label: 'Catering / Events' },
  { value: 'other', label: 'Other' }
]

const basicsSchema = z.object({
  name: z.string().trim().min(1, '⚠ Please enter an organization name.'),
  businessType: z.enum(BUSINESS_TYPE_VALUES).optional()
})

export type OrganizationBasicsFormValues = z.infer<typeof basicsSchema>

interface OrganizationBasicsStepProps {
  value: OrganizationBasicsFormValues
  onUpdate: (value: OrganizationBasicsFormValues) => void
  onComplete: (value: OrganizationBasicsFormValues) => void
  setupError?: string | null
}

export function OrganizationBasicsStep({ 
  value, 
  onUpdate, 
  onComplete, 
  setupError 
}: OrganizationBasicsStepProps) {
  const form = useForm<OrganizationBasicsFormValues>({
    resolver: zodResolver(basicsSchema),
    mode: 'onBlur',
    defaultValues: value
  })

  const commit = useCallback(() => {
    const current = form.getValues()
    onUpdate({
      name: current.name?.trim() || '',
      businessType: current.businessType || undefined
    })
  }, [form, onUpdate])

  const handleSubmit = form.handleSubmit(async (data) => {
    const normalized = {
      name: data.name.trim(),
      businessType: data.businessType || undefined
    }
    
    onUpdate(normalized)
    onComplete(normalized)
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[color:var(--text)]">Organization basics</h2>
        <p className="text-sm text-[color:var(--text-muted)]">
          Name your organization and categorize your business.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-5">
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