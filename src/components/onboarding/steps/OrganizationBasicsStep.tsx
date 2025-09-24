import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image, Store, Upload } from 'lucide-react'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

const LOGO_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const
const LOGO_FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg'] as const
const MAX_LOGO_FILE_SIZE = 1024 * 1024 // 1MB

const organizationLogoSchema = z.object({
  dataUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().nonnegative(),
  fileType: z.string().min(1)
})

const basicsSchema = z.object({
  name: z.string().trim().min(1, '⚠ Please enter an organization name.'),
  businessType: z.enum(BUSINESS_TYPE_VALUES).optional(),
  logo: organizationLogoSchema.nullable().optional()
})

export type OrganizationBasicsFormValues = z.infer<typeof basicsSchema>
export type OrganizationLogoValue = z.infer<typeof organizationLogoSchema>

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

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const triggerFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('Invalid file result'))
        }
      }
      reader.onerror = () => {
        reject(reader.error ?? new Error('Unable to read file'))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const formatFileSize = useCallback((size: number) => {
    if (size <= 0) return '0 B'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`
    return `${Math.round(size / 104857.6) / 10} MB`
  }, [])

  const commit = useCallback(() => {
    const current = form.getValues()
    onUpdate({
      name: current.name?.trim() || '',
      businessType: current.businessType || undefined,
      logo: current.logo ?? null
    })
  }, [form, onUpdate])

  const handleSubmit = form.handleSubmit(async (data) => {
    const normalized = {
      name: data.name.trim(),
      businessType: data.businessType || undefined,
      logo: data.logo ?? null
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
            name="logo"
            render={({ field }) => {
              const logo = field.value ?? null

              const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }

                const fileExtension = file.name.split('.').pop()?.toLowerCase()
                const isValidType =
                  LOGO_FILE_TYPES.includes(file.type as (typeof LOGO_FILE_TYPES)[number]) ||
                  (fileExtension ? LOGO_FILE_EXTENSIONS.includes(fileExtension as (typeof LOGO_FILE_EXTENSIONS)[number]) : false)

                if (!isValidType) {
                  form.setError('logo', {
                    type: 'validate',
                    message: 'Logo must be a PNG, JPG, or SVG file.'
                  })
                  clearFileInput()
                  return
                }

                if (file.size > MAX_LOGO_FILE_SIZE) {
                  form.setError('logo', {
                    type: 'validate',
                    message: 'Logo file size must be 1 MB or smaller.'
                  })
                  clearFileInput()
                  return
                }

                try {
                  const dataUrl = await readFileAsDataUrl(file)
                  const payload: OrganizationLogoValue = {
                    dataUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type || 'image'
                  }

                  form.clearErrors('logo')
                  form.setValue('logo', payload, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                  commit()
                } catch (error) {
                  console.error('Unable to read selected logo file', error)
                  form.setError('logo', {
                    type: 'validate',
                    message: 'We could not read that image. Try a different file.'
                  })
                  form.setValue('logo', null, { shouldDirty: true, shouldTouch: true })
                } finally {
                  clearFileInput()
                }
              }

              const handleRemoveLogo = () => {
                form.clearErrors('logo')
                form.setValue('logo', null, { shouldDirty: true, shouldTouch: true })
                commit()
                clearFileInput()
              }

              const previewAlt = form.getValues('name')?.trim() || 'Organization logo'

              return (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[13px] font-semibold text-[color:var(--text)]">
                    Workspace logo <span className="text-[12px] text-[color:var(--text-muted)]">(optional)</span>
                  </FormLabel>
                  <FormDescription className="text-[12px] text-[color:var(--text-muted)]">
                    Appears in navigation and communications.
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-3 rounded-[12px] border border-dashed border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/60 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]">
                            {logo?.dataUrl ? (
                              <AvatarImage src={logo.dataUrl} alt={previewAlt} className="h-full w-full object-contain p-1" />
                            ) : (
                              <AvatarFallback className="bg-[color:var(--surface-pop-2)] text-[color:var(--text-muted)]">
                                <Image className="h-6 w-6" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-[13px] font-semibold text-[color:var(--text)]">
                              {logo?.fileName ?? 'Upload a logo'}
                            </p>
                            <p className="text-[12px] text-[color:var(--text-muted)]">
                              {logo ? formatFileSize(logo.fileSize) : 'PNG, JPG, or SVG (max 1 MB)'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 rounded-[10px] px-3 text-[13px]"
                            onClick={triggerFileDialog}
                          >
                            <Upload className="h-4 w-4" /> Upload logo
                          </Button>
                          {logo && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 rounded-[10px] px-3 text-[13px] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                              onClick={handleRemoveLogo}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <Store className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    Organization name
                    <span aria-hidden="true" className="text-[color:var(--brand-accent)] opacity-80">*</span>
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Reykjavík Restaurant Group"
                    aria-required="true"
                    {...field}
                    onBlur={event => {
                      field.onBlur()
                      const trimmed = event.target.value.trim()
                      form.setValue('name', trimmed, { shouldDirty: true, shouldValidate: true })
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
            name="businessType"
            render={({ field }) => (
              <FormItem className="group space-y-2">
                <FormLabel className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--text)]">
                  <Store className="h-5 w-5 flex-shrink-0 text-[color:var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-accent)]" />
                  <span className="flex items-center gap-1">
                    Business type
                    <span className="text-[12px] font-normal text-[color:var(--text-muted)]">(optional)</span>
                  </span>
                </FormLabel>
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
                      <SelectValue placeholder="Choose a category" />
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