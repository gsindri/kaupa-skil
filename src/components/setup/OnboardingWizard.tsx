
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Building2, Plug, ShoppingCart } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const [supplierCredentials, setSupplierCredentials] = useState({
    name: '',
    username: '',
    password: ''
  })
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const steps = [
    { id: 1, title: 'Create Organization', icon: Building2 },
    { id: 2, title: 'Connect Supplier', icon: Plug },
    { id: 3, title: 'Build Order Guide', icon: ShoppingCart }
  ]

  const sampleItems = [
    { id: '1', name: 'Extra Virgin Olive Oil', brand: 'Bertolli' },
    { id: '2', name: 'Icelandic Skyr Plain', brand: 'KEA' },
    { id: '3', name: 'Organic Carrots', brand: 'Nordic Fresh' },
    { id: '4', name: 'Whole Milk 3.9%', brand: 'MS' },
    { id: '5', name: 'Artisan Bread Rolls', brand: 'Bakery Plus' }
  ]

  const handleNext = () => {
    if (currentStep === 1) {
      if (!orgName.trim()) {
        toast({
          title: 'Organization name required',
          description: 'Please enter your organization name',
          variant: 'destructive'
        })
        return
      }
      toast({
        title: 'Organization created',
        description: `Welcome to ${orgName}!`
      })
    } else if (currentStep === 2) {
      if (!supplierCredentials.name || !supplierCredentials.username) {
        toast({
          title: 'Supplier credentials required',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        })
        return
      }
      toast({
        title: 'Supplier connected',
        description: `${supplierCredentials.name} has been connected successfully`
      })
    }
    
    setCurrentStep(currentStep + 1)
  }

  const handleFinish = () => {
    if (selectedItems.size < 3) {
      toast({
        title: 'Select more items',
        description: 'Please select at least 3 items for your order guide',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Setup complete!',
      description: 'Your procurement console is ready to use'
    })
    onComplete()
  }

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const progress = (currentStep - 1) * 33.33

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Welcome to ProcureWise</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex items-center space-x-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${
                    currentStep > step.id ? 'bg-primary text-primary-foreground' :
                    currentStep === step.id ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Your Organization</h3>
                <p className="text-muted-foreground mb-4">
                  Let's start by setting up your organization profile
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Connect Your First Supplier</h3>
                <p className="text-muted-foreground mb-4">
                  Add credentials for your primary supplier to start importing products
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    value={supplierCredentials.name}
                    onChange={(e) => setSupplierCredentials(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Véfkaupmenn"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={supplierCredentials.username}
                    onChange={(e) => setSupplierCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Your supplier portal username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={supplierCredentials.password}
                    onChange={(e) => setSupplierCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Your supplier portal password"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Build Your First Order Guide</h3>
                <p className="text-muted-foreground mb-4">
                  Select items from our sample catalog to create your first order guide
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {sampleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItems.has(item.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.brand}</div>
                      </div>
                      {selectedItems.has(item.id) && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Selected: {selectedItems.size}/5 items
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
