import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useBlocker, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Info, Loader2 } from 'lucide-react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { OrganizationBasicsStep, type OrganizationBasicsFormValues } from './steps/OrganizationBasicsStep'
import { DeliveryDetailsStep, type DeliveryDetailsFormValues } from './steps/DeliveryDetailsStep'
import { InvoicingSetupStep, type InvoicingSetupFormValues } from './steps/InvoicingSetupStep'
import { ContactInformationStep, type ContactInformationFormValues } from './steps/ContactInformationStep'
import { SupplierSelectionStep, type SupplierOption } from './steps/SupplierSelectionStep'
import { ReviewStep, type ReviewPreferences } from './steps/ReviewStep'
import { useLocaleDefaults } from '@/utils/locale'
import type { Database } from '@/lib/types'

const DRAFT_STORAGE_KEY = 'workspace_setup_draft'
const STATUS_STORAGE_KEY = 'workspace_setup_status'
const PREFERENCES_STORAGE_KEY = 'workspace_preferences'
const TOTAL_STEPS = 6

type OnboardingLocationState = {
  from?: string
  allowExisting?: boolean
}

type AddressValues = {
  line1: string
  line2: string
  postalCode: string
  city: string
}

// Combined form values from all steps
type CombinedFormValues = OrganizationBasicsFormValues & 
  DeliveryDetailsFormValues & 
  InvoicingSetupFormValues & 
  ContactInformationFormValues

const trimString = (value?: string | null) => value?.trim() ?? ''

const createEmptyAddress = (): AddressValues => ({
  line1: '',
  line2: '',
  postalCode: '',
  city: ''
})

const EMPTY_COMBINED_VALUES: CombinedFormValues = {
  name: '',
  businessType: undefined,
  logo: null,
  deliveryAddress: createEmptyAddress(),
  vat: '',
  useSeparateInvoiceAddress: false,
  invoiceAddress: createEmptyAddress(),
  contactName: '',
  email: '',
  phone: ''
}

interface DraftState {
  combinedValues: CombinedFormValues
  selectedSupplierIds: string[]
  currentStep: number
  preferences: ReviewPreferences
}

interface StepDefinition {
  id: number
  title: string
  description: string
}

interface OnboardingWizardProps {
  onSkip?: () => void
  onComplete?: () => void
}

type SupplierRow = Database['public']['Tables']['suppliers']['Row']

function mapConnectorType(connectorType?: string | null) {
  switch (connectorType) {
    case 'api':
      return 'API-connected partner'
    case 'portal':
      return 'Portal upload ready'
    case 'email':
      return 'Email order flow'
    default:
      return 'Marketplace supplier'
  }
}

export function OnboardingWizard({ onSkip, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user, profile, profileLoading, refetch } = useAuth()
  const { language: defaultLanguage, currency: defaultCurrency } = useLocaleDefaults()

  const currentPath = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search]
  )

  const locationState = useMemo(
    () => (location.state as OnboardingLocationState | null) ?? null,
    [location.state]
  )

  const previousPath = useMemo(() => {
    const raw = locationState?.from
    if (!raw || typeof raw !== 'string') {
      return null
    }
    const trimmed = raw.trim()
    if (!trimmed) {
      return null
    }
    return trimmed
  }, [locationState])

  const allowExistingWorkspaceCreation = locationState?.allowExisting ?? false

  const navigateToPrevious = useCallback(() => {
    const target = previousPath && previousPath !== currentPath ? previousPath : '/'
    navigate(target, { replace: true })
  }, [currentPath, navigate, previousPath])

  const [currentStep, setCurrentStep] = useState(1)
  const [combinedValues, setCombinedValues] = useState<CombinedFormValues>(EMPTY_COMBINED_VALUES)
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
  const [preferences, setPreferences] = useState<ReviewPreferences>({
    language: defaultLanguage,
    currency: defaultCurrency
  })
  const [setupError, setSetupError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [exitDialogContext, setExitDialogContext] = useState<'manual' | 'blocked' | null>(null)
  const [pendingExitAction, setPendingExitAction] = useState<'skip' | 'complete' | null>(null)

  const exitDialogContextRef = React.useRef<'manual' | 'blocked' | null>(null)

  const goBackToOrigin = useCallback(() => {
    setAllowNavigation(true)
    navigateToPrevious()
  }, [navigateToPrevious])

  const steps = useMemo<StepDefinition[]>(
    () => [
      {
        id: 1,
        title: 'Organization basics',
        description: 'Name your organization and categorize your business.'
      },
      {
        id: 2,
        title: 'Delivery details',
        description: 'Tell us where orders should be delivered.'
      },
      {
        id: 3,
        title: 'Invoicing setup',
        description: 'Set invoice preferences and required tax details.'
      },
      {
        id: 4,
        title: 'Contact information',
        description: 'Share who suppliers should reach out to.'
      },
      {
        id: 5,
        title: 'Connect suppliers',
        description: 'Select suppliers to connect now. You can add more later.'
      },
      {
        id: 6,
        title: 'Review & finish',
        description: 'Confirm details before you start.'
      }
    ],
    []
  )

  useEffect(() => {
    if (profileLoading) return
    if (profile?.tenant_id && !allowExistingWorkspaceCreation) {
      toast({
        title: 'Setup already complete!',
        description: 'Your workspace is ready to use.'
      })
      navigateToPrevious()
    }
  }, [profile, profileLoading, toast, navigateToPrevious, allowExistingWorkspaceCreation])

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoaded) return
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<DraftState>
        if (parsed.combinedValues) {
          setCombinedValues(prev => ({ ...prev, ...parsed.combinedValues }))
        }
        if (Array.isArray(parsed.selectedSupplierIds)) {
          setSelectedSupplierIds(Array.from(new Set(parsed.selectedSupplierIds)))
        }
        if (parsed.preferences) {
          setPreferences(prev => ({
            language: parsed.preferences?.language || prev.language,
            currency: parsed.preferences?.currency || prev.currency
          }))
        }
        if (parsed.currentStep) {
          setCurrentStep(Math.min(Math.max(1, parsed.currentStep), TOTAL_STEPS))
        }
      } catch (error) {
        console.warn('Unable to load onboarding draft:', error)
      }
    }
    setDraftLoaded(true)
  }, [draftLoaded])

  useEffect(() => {
    if (!draftLoaded || typeof window === 'undefined') return
    const draft: DraftState = {
      combinedValues,
      selectedSupplierIds,
      currentStep,
      preferences
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [combinedValues, selectedSupplierIds, preferences, currentStep, draftLoaded])

  const {
    data: marketplaceSuppliers = [],
    isLoading: suppliersLoading,
    error: suppliersError
  } = useQuery<SupplierOption[]>({
    queryKey: ['onboarding', 'suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, logo_url, connector_type')
        .order('name')

      if (error) {
        throw error
      }

      return (
        (data ?? []).map(item => {
          const typed = item as Pick<SupplierRow, 'id' | 'name' | 'logo_url' | 'connector_type'>
          return {
            id: typed.id,
            name: typed.name,
            logo_url: typed.logo_url,
            subtitle: mapConnectorType(typed.connector_type),
            is_verified: true,
            status: 'active'
          }
        }) || []
      )
    },
    staleTime: 1000 * 60 * 5
  })

  useEffect(() => {
    if (suppliersError instanceof Error) {
      toast({
        title: 'Supplier directory unavailable',
        description: suppliersError.message,
        variant: 'destructive'
      })
    }
  }, [suppliersError, toast])

  const hasFormDetails = useMemo(() => {
    return (
      Boolean(combinedValues.name) ||
      Boolean(combinedValues.contactName) ||
      Boolean(combinedValues.phone) ||
      Boolean(combinedValues.deliveryAddress.line1) ||
      Boolean(combinedValues.vat) ||
      Boolean(combinedValues.email) ||
      Boolean(combinedValues.logo?.dataUrl)
    )
  }, [combinedValues])

  const hasDraft = hasFormDetails || selectedSupplierIds.length > 0 || currentStep > 1
  const shouldBlockNavigation = !allowNavigation && !isCompleting && hasDraft
  const blocker = useBlocker(shouldBlockNavigation)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      exitDialogContextRef.current = 'blocked'
      setExitDialogContext('blocked')
      setExitDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!allowNavigation || !pendingExitAction) {
      return
    }

    const action = pendingExitAction
    setPendingExitAction(null)

    if (action === 'skip') {
      if (onSkip) {
        onSkip()
      } else {
        navigateToPrevious()
      }
    } else if (action === 'complete') {
      if (onComplete) {
        onComplete()
      } else {
        navigateToPrevious()
      }
    }
  }, [allowNavigation, navigateToPrevious, onComplete, onSkip, pendingExitAction])

  useEffect(() => {
    if (!shouldBlockNavigation) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = 'Your setup progress is saved. Exit setup?'
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlockNavigation])

  const currentStepDefinition = useMemo(
    () => steps.find(step => step.id === currentStep),
    [steps, currentStep]
  )

  const stepTitle = currentStepDefinition?.title ?? ''
  const stepDescription = currentStepDefinition?.description ?? ''
  // Step update handlers
  const handleBasicsUpdate = useCallback((values: OrganizationBasicsFormValues) => {
    setCombinedValues(prev => ({ ...prev, ...values }))
    if (setupError) setSetupError(null)
  }, [setupError])

  const handleDeliveryUpdate = useCallback((values: DeliveryDetailsFormValues) => {
    setCombinedValues(prev => ({ ...prev, ...values }))
    if (setupError) setSetupError(null)
  }, [setupError])

  const handleInvoicingUpdate = useCallback((values: InvoicingSetupFormValues) => {
    setCombinedValues(prev => ({ ...prev, ...values }))
    if (setupError) setSetupError(null)
  }, [setupError])

  const handleContactUpdate = useCallback((values: ContactInformationFormValues) => {
    setCombinedValues(prev => ({ ...prev, ...values }))
    if (setupError) setSetupError(null)
  }, [setupError])

  // Step complete handlers
  const handleStepComplete = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }, [])

  const handleSupplierToggle = useCallback((supplierId: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }, [])

  const handleSupplierContinue = useCallback(() => {
    if (selectedSupplierIds.length === 0) {
      toast({
        title: "No suppliers selected",
        description: "You haven't connected any suppliers yet.",
        duration: 4000
      })
    }
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }, [selectedSupplierIds.length, toast])

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      // On first step, exit setup
      goBackToOrigin()
      return
    }
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [currentStep, goBackToOrigin])

  const requestExit = useCallback(() => {
    exitDialogContextRef.current = 'manual'
    setExitDialogContext('manual')
    setExitDialogOpen(true)
  }, [])

  const exitSetup = useCallback(() => {
    setExitDialogOpen(false)
    setAllowNavigation(true)
    setPendingExitAction('skip')
  }, [])

  const completeOnboarding = useCallback(async () => {
    if (!user) return
    setIsCompleting(true)
    setSetupError(null)

    try {
      const trimmedName = combinedValues.name.trim()
      const { data: existingTenant, error: checkError } = await supabase
        .from('tenants')
        .select('id, name, created_by')
        .eq('name', trimmedName)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let tenant = existingTenant

      if (existingTenant && existingTenant.created_by !== user.id) {
        setSetupError(`An organization named "${trimmedName}" already exists. Try another name.`)
        setCurrentStep(1)
        return
      }

      if (!tenant) {
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({ name: trimmedName, created_by: user.id })
          .select()
          .single()

        if (tenantError) {
          if ((tenantError as any).code === '23505') {
            setSetupError(`An organization named "${trimmedName}" already exists. Try another name.`)
            setCurrentStep(1)
            return
          }
          throw tenantError
        }

        tenant = newTenant
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id)

      if (profileError) {
        throw profileError
      }

      if (selectedSupplierIds.length > 0) {
        const { error: connectionsError } = await supabase
          .from('supplier_connections')
          .upsert(
            selectedSupplierIds.map(id => ({
              tenant_id: tenant.id,
              supplier_id: id,
              status: 'connected'
            })),
            { onConflict: 'tenant_id,supplier_id' }
          )

        if (connectionsError) {
          throw connectionsError
        }
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STATUS_STORAGE_KEY, 'complete')
        window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
        window.localStorage.removeItem('onboardingSkipped')
      }

      toast({
        title: 'Workspace ready.',
        description: 'You can tweak settings anytime.'
      })

      await refetch()
      setAllowNavigation(true)
      setPendingExitAction('complete')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to complete setup. Please try again.'
      setSetupError(message)
      setCurrentStep(1)
      toast({
        title: 'Setup failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsCompleting(false)
    }
  }, [combinedValues, preferences, refetch, selectedSupplierIds, toast, user])

  const emphasizedPrimaryClass =
    'justify-center bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)] hover:bg-[var(--brand-accent)]/90'

  const backButtonClass =
    'w-full justify-start text-[color:var(--text-muted)] hover:bg-transparent hover:text-[color:var(--text)] sm:w-auto'

  const exitLinkClass =
    'px-0 text-xs font-normal text-[color:var(--text-muted)] opacity-80 underline-offset-4 transition-colors hover:text-[color:var(--text)] hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50'

  const exitDialogCopy =
    exitDialogContext === 'blocked'
      ? {
          title: 'Leave workspace setup?',
          description:
            'Your progress has been saved. Leaving now will keep your draft ready for when you return.'
        }
      : {
          title: 'Leave workspace setup?',
          description:
            'Your progress has been saved. You can finish setup anytime from your dashboard.'
        }

  // Step-specific footers
  const stepFooter = useMemo(() => {
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === TOTAL_STEPS
    
    if (isLastStep) {
      // Review step footer
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Button
              variant="ghost"
              size="lg"
              className={backButtonClass}
              onClick={handleBack}
              disabled={isCompleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <button
              type="button"
              className={exitLinkClass}
              onClick={requestExit}
              disabled={isCompleting}
            >
              Exit setup
            </button>
          </div>
          <Button
            size="lg"
            className={cn(emphasizedPrimaryClass, 'w-full sm:w-auto')}
            onClick={completeOnboarding}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating workspace...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finish setup
              </>
            )}
          </Button>
        </div>
      )
    }

    if (currentStep === 5) {
      // Supplier selection footer
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Button
              variant="ghost"
              size="lg"
              className={backButtonClass}
              onClick={handleBack}
              disabled={isCompleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <button
              type="button"
              className={exitLinkClass}
              onClick={requestExit}
              disabled={isCompleting}
            >
              Exit setup
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <span className="text-center text-[13px] text-[color:var(--text-muted)] sm:text-left">
              {selectedSupplierIds.length} selected
            </span>
            <Button
              size="lg"
              className={cn(emphasizedPrimaryClass, 'w-full sm:w-auto')}
              onClick={handleSupplierContinue}
              disabled={isCompleting}
            >
              Continue
            </Button>
          </div>
        </div>
      )
    }

    // Default footer for form steps 1-4
    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          {!isFirstStep && (
            <Button
              variant="ghost"
              size="lg"
              className={backButtonClass}
              onClick={handleBack}
              disabled={isCompleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <button
            type="button"
            className={exitLinkClass}
            onClick={requestExit}
            disabled={isCompleting}
          >
            Exit setup
          </button>
        </div>
        <Button
          size="lg"
          className={cn(emphasizedPrimaryClass, 'w-full sm:w-auto')}
          onClick={handleStepComplete}
          disabled={isCompleting}
        >
          Continue
        </Button>
      </div>
    )
  }, [currentStep, isCompleting, handleBack, requestExit, handleStepComplete, handleSupplierContinue, completeOnboarding, selectedSupplierIds.length])

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[520px] space-y-8">
          {/* Progress Header */}
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand-accent)] text-white">
                <span className="text-lg font-semibold">{currentStep}</span>
              </div>
            </div>
            <div className="mb-3 flex w-full items-center gap-1.5">
              {steps.map(step => (
                <span
                  key={step.id}
                  aria-hidden="true"
                  className="h-2.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      step.id <= currentStep ? 'var(--brand-accent)' : 'var(--surface-muted)',
                    opacity: step.id < currentStep ? 1 : step.id === currentStep ? 0.85 : 0.45
                  }}
                />
              ))}
            </div>
            <p className="text-sm text-[color:var(--text-muted)]">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>

          {/* Step Title */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-[color:var(--text)]">{stepTitle}</h1>
            {stepDescription && (
              <p className="text-base text-[color:var(--text-muted)]">{stepDescription}</p>
            )}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <OrganizationBasicsStep
                value={{
                  name: combinedValues.name,
                  businessType: combinedValues.businessType
                }}
                onUpdate={handleBasicsUpdate}
                onComplete={handleStepComplete}
                setupError={setupError}
              />
            )}

            {currentStep === 2 && (
              <DeliveryDetailsStep
                value={{
                  deliveryAddress: combinedValues.deliveryAddress
                }}
                onUpdate={handleDeliveryUpdate}
                onComplete={handleStepComplete}
                setupError={setupError}
              />
            )}

            {currentStep === 3 && (
              <InvoicingSetupStep
                value={{
                  vat: combinedValues.vat,
                  useSeparateInvoiceAddress: combinedValues.useSeparateInvoiceAddress,
                  invoiceAddress: combinedValues.invoiceAddress
                }}
                onUpdate={handleInvoicingUpdate}
                onComplete={handleStepComplete}
                setupError={setupError}
              />
            )}

            {currentStep === 4 && (
              <ContactInformationStep
                value={{
                  contactName: combinedValues.contactName,
                  email: combinedValues.email,
                  phone: combinedValues.phone
                }}
                onUpdate={handleContactUpdate}
                onComplete={handleStepComplete}
                setupError={setupError}
              />
            )}

            {currentStep === 5 && (
              <SupplierSelectionStep
                suppliers={marketplaceSuppliers}
                selectedIds={selectedSupplierIds}
                onToggle={handleSupplierToggle}
                onInviteSupplier={() => {}}
                isLoading={suppliersLoading}
                footer={null}
              />
            )}

            {currentStep === 6 && (
              <ReviewStep
                organization={{
                  name: combinedValues.name,
                  businessType: combinedValues.businessType,
                  contactName: combinedValues.contactName,
                  phone: combinedValues.phone,
                  deliveryAddress: combinedValues.deliveryAddress,
                  vat: combinedValues.vat,
                  email: combinedValues.email,
                  useSeparateInvoiceAddress: combinedValues.useSeparateInvoiceAddress,
                  invoiceAddress: combinedValues.invoiceAddress
                }}
                suppliers={marketplaceSuppliers.filter(s => selectedSupplierIds.includes(s.id))}
                selectedSupplierIds={selectedSupplierIds}
                preferences={preferences}
                onPreferencesChange={setPreferences}
                onEditOrganization={() => setCurrentStep(1)}
                onEditSuppliers={() => setCurrentStep(5)}
                footer={null}
              />
            )}
          </div>

          {/* Footer */}
          <div className="pt-6">
            {stepFooter}
          </div>
        </div>
      </div>

      {/* Exit Dialog */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{exitDialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{exitDialogCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setExitDialogOpen(false)
                if (blocker.state === 'blocked') {
                  blocker.reset?.()
                }
              }}
            >
              Stay and finish
            </AlertDialogCancel>
            <AlertDialogAction onClick={exitSetup}>Leave setup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}