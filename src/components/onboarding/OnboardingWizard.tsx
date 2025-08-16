
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { OrganizationSetupStep } from './steps/OrganizationSetupStep'
import { SupplierConnectionStep } from './steps/SupplierConnectionStep'
import { OrderGuideStep } from './steps/OrderGuideStep'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface OnboardingData {
  organization?: {
    name: string
    address: string
    phone: string
    contactName: string
  }
  suppliers?: string[]
  orderGuide?: {
    categories: string[]
    preferredSuppliers: string[]
  }
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})
  const [isCompleting, setIsCompleting] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const { user, profile, refetch } = useAuth()
  const { toast } = useToast()

  const steps = [
    { id: 1, title: 'Organization Setup', description: 'Set up your organization details' },
    { id: 2, title: 'Connect Suppliers', description: 'Connect to your first suppliers' },
    { id: 3, title: 'Order Guide', description: 'Configure your ordering preferences' }
  ]

  const progress = (currentStep / steps.length) * 100

  const handleStepComplete = (stepData: any) => {
    setData(prev => ({ ...prev, ...stepData }))
    
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    if (!data.organization || !user) return

    // Check if user already has a tenant_id (setup was already completed)
    if (profile?.tenant_id) {
      console.log('User already has tenant_id, refreshing auth state')
      toast({
        title: 'Setup already complete!',
        description: 'Your organization is ready to use.'
      })
      await refetch()
      return
    }

    setIsCompleting(true)
    setSetupError(null)
    
    try {
      console.log('Creating tenant for user:', user.id)
      
      // First check if a tenant with this name already exists
      const { data: existingTenant, error: checkError } = await supabase
        .from('tenants')
        .select('id, name, created_by')
        .eq('name', data.organization.name)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let tenant = existingTenant

      // If tenant exists and user created it, just associate the user
      if (existingTenant && existingTenant.created_by === user.id) {
        console.log('Found existing tenant created by user:', existingTenant.id)
        tenant = existingTenant
      } 
      // If tenant exists but was created by someone else, suggest different name
      else if (existingTenant) {
        setSetupError(`An organization named "${data.organization.name}" already exists. Please choose a different name.`)
        setCurrentStep(1) // Go back to organization setup
        return
      }
      // Create new tenant
      else {
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: data.organization.name,
            created_by: user.id
          })
          .select()
          .single()

        if (tenantError) {
          if (tenantError.code === '23505') { // Unique constraint violation
            setSetupError(`An organization named "${data.organization.name}" already exists. Please choose a different name.`)
            setCurrentStep(1)
            return
          }
          throw tenantError
        }

        tenant = newTenant
        console.log('New tenant created:', tenant)
      }

      // Update the user's profile with the tenant_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id)

      if (profileError) throw profileError

      console.log('Profile updated with tenant_id:', tenant.id)

      toast({
        title: 'Setup complete!',
        description: `Welcome to ${tenant.name}. Your procurement console is ready to use.`
      })

      // Refresh auth to update the user's profile
      await refetch()
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error)
      setSetupError(error.message || 'Failed to complete setup. Please try again.')
      toast({
        title: 'Setup failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setSetupError(null) // Clear any errors when going back
    }
  }

  const retrySetup = () => {
    setSetupError(null)
    setCurrentStep(1) // Go back to organization setup to change name
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto animate-spin" />
              <h2 className="text-xl font-semibold">Setting up your account...</h2>
              <p className="text-muted-foreground">This will just take a moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if there's a setup error
  if (setupError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Setup Issue</h1>
            <p className="text-muted-foreground">
              There was an issue completing your setup.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Setup Error</CardTitle>
              <CardDescription>Please resolve this issue to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive">{setupError}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={retrySetup} className="flex-1">
                    Choose Different Name
                  </Button>
                  <Button variant="outline" onClick={() => setSetupError(null)}>
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to ProcureWise</h1>
          <p className="text-muted-foreground">Let's get your account set up in just a few steps</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
          </p>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
            <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <OrganizationSetupStep 
                onComplete={handleStepComplete}
                initialData={data.organization}
                error={setupError}
              />
            )}
            {currentStep === 2 && (
              <SupplierConnectionStep 
                onComplete={handleStepComplete}
                onBack={goBack}
                initialData={data.suppliers}
              />
            )}
            {currentStep === 3 && (
              <OrderGuideStep 
                onComplete={handleStepComplete}
                onBack={goBack}
                initialData={data.orderGuide}
                organizationData={data.organization}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
