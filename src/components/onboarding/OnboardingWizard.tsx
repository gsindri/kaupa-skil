
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle } from 'lucide-react'
import { OrganizationSetupStep } from './steps/OrganizationSetupStep'
import { SupplierConnectionStep } from './steps/SupplierConnectionStep'
import { OrderGuideStep } from './steps/OrderGuideStep'
import { useAuth } from '@/contexts/AuthProvider'

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
  const { refetch } = useAuth()

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
    setIsCompleting(true)
    try {
      // Here we would normally save the data to the backend
      console.log('Completing onboarding with data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refresh auth to update the user's profile
      await refetch()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <h2 className="text-xl font-semibold">Setting up your account...</h2>
              <p className="text-muted-foreground">This will just take a moment.</p>
            </div>
          </CardContent>
        </Card>
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
                    ? 'bg-success text-success-foreground' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-success' : 'bg-muted'
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
