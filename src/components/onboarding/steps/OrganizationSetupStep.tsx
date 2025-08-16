
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building, User, Phone, MapPin, AlertTriangle } from 'lucide-react'

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
})

type OrganizationData = z.infer<typeof organizationSchema>

interface OrganizationSetupStepProps {
  onComplete: (data: { organization: OrganizationData }) => void
  initialData?: OrganizationData
  error?: string | null
}

export function OrganizationSetupStep({ onComplete, initialData, error }: OrganizationSetupStepProps) {
  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: initialData || {
      name: '',
      address: '',
      phone: '',
      contactName: '',
    }
  })

  const onSubmit = (data: OrganizationData) => {
    onComplete({ organization: data })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tell us about your organization</h3>
        <p className="text-muted-foreground">
          This information will be used for orders and supplier communications.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-destructive font-medium">Setup Error</p>
            <p className="text-destructive/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization Name
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Reykjavik Restaurant Group" 
                    {...field} 
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
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact Name
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Jón Jónsson" 
                    {...field} 
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
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., +354 555 1234" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Business Address
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g., Laugavegur 1, 101 Reykjavik, Iceland"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
