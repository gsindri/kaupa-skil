import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  OrganizationStep,
  type OrganizationStepHandle,
  type OrganizationFormValues,
  type OrganizationStepFooterContext,
  type BusinessTypeValue,
  BUSINESS_TYPE_VALUES,
  type OrganizationSectionProgress,
  ORGANIZATION_SECTION_DEFINITIONS
} from './steps/OrganizationStep'
import { SupplierSelectionStep, type SupplierOption } from './steps/SupplierSelectionStep'
import { ReviewStep, type ReviewPreferences } from './steps/ReviewStep'
import { useLocaleDefaults } from '@/utils/locale'
import type { Database } from '@/lib/types'

const DRAFT_STORAGE_KEY = 'workspace_setup_draft'
const STATUS_STORAGE_KEY = 'workspace_setup_status'
const PREFERENCES_STORAGE_KEY = 'workspace_preferences'
const TOTAL_STEPS = 3

type OnboardingLocationState = {
  from?: string
  allowExisting?: boolean
}

type AddressValues = OrganizationFormValues['deliveryAddress']

const trimString = (value?: string | null) => value?.trim() ?? ''

const createEmptyAddress = (): AddressValues => ({
  line1: '',
  line2: '',
  postalCode: '',
  city: ''
})

const ensureAddress = (address?: Partial<AddressValues> | null): AddressValues => ({
  line1: trimString(address?.line1),
  line2: trimString(address?.line2),
  postalCode: trimString(address?.postalCode),
  city: trimString(address?.city)
})

const addressHasDetails = (address?: Partial<AddressValues> | null) => {
  if (!address) return false
  return Boolean(
    trimString(address.line1) ||
      trimString(address.postalCode) ||
      trimString(address.city) ||
      trimString(address.line2)
  )
}

const migrateOrganization = (
  raw?: Partial<OrganizationFormValues> & {
    address?: string
    invoiceAddress?: unknown
  }
): OrganizationFormValues => {
  const source = raw ?? {}

  let deliveryAddress = ensureAddress((source as any).deliveryAddress as Partial<AddressValues> | undefined)
  if (!addressHasDetails(deliveryAddress) && typeof source.address === 'string') {
    const legacy = trimString(source.address)
    if (legacy) {
      deliveryAddress = {
        ...deliveryAddress,
        line1: legacy
      }
    }
  }

  let invoiceAddress: AddressValues
  const rawInvoice = (source as any).invoiceAddress
  if (typeof rawInvoice === 'string') {
    const legacyInvoice = trimString(rawInvoice)
    invoiceAddress = createEmptyAddress()
    if (legacyInvoice) {
      invoiceAddress.line1 = legacyInvoice
    }
  } else {
    invoiceAddress = ensureAddress(rawInvoice as Partial<AddressValues> | undefined)
  }

  const rawBusinessType = (source as any).businessType
  const businessType =
    typeof rawBusinessType === 'string' && (BUSINESS_TYPE_VALUES as readonly string[]).includes(rawBusinessType)
      ? (rawBusinessType as BusinessTypeValue)
      : undefined

  const useSeparate =
    typeof source.useSeparateInvoiceAddress === 'boolean' ? source.useSeparateInvoiceAddress : false

  return {
    name: trimString(source.name),
    businessType,
    contactName: trimString(source.contactName),
    phone: trimString(source.phone),
    deliveryAddress,
    vat: trimString(source.vat),
    email: trimString(source.email),
    useSeparateInvoiceAddress: useSeparate,
    invoiceAddress
  }
}

const EMPTY_ORGANIZATION: OrganizationFormValues = {
  name: '',
  businessType: undefined,
  contactName: '',
  phone: '',
  deliveryAddress: createEmptyAddress(),
  vat: '',
  email: '',
  useSeparateInvoiceAddress: false,
  invoiceAddress: createEmptyAddress()
}

interface DraftState {
  organization: OrganizationFormValues
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
  const [organization, setOrganization] = useState<OrganizationFormValues>(EMPTY_ORGANIZATION)
  const [organizationSectionProgress, setOrganizationSectionProgress] = useState({
    index: 0,
    total: ORGANIZATION_SECTION_DEFINITIONS.length,
    title: ORGANIZATION_SECTION_DEFINITIONS[0].title,
    description: ORGANIZATION_SECTION_DEFINITIONS[0].description
  })
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

  const organizationStepRef = useRef<OrganizationStepHandle>(null)
  const exitDialogContextRef = useRef<'manual' | 'blocked' | null>(null)

  const steps = useMemo<StepDefinition[]>(
    () => [
      {
        id: 1,
        title: 'Organization',
        description: 'Used for orders and supplier communications.'
      },
      {
        id: 2,
        title: 'Connect suppliers',
        description: 'Select suppliers to connect now. You can add more later.'
      },
      {
        id: 3,
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
        if (parsed.organization) {
          setOrganization(migrateOrganization(parsed.organization))
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
      organization,
      selectedSupplierIds,
      currentStep,
      preferences
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [organization, selectedSupplierIds, preferences, currentStep, draftLoaded])

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

  const hasOrganizationDetails = useMemo(() => {
    const deliveryAddressFilled = addressHasDetails(organization.deliveryAddress)
    const invoiceAddressFilled = addressHasDetails(organization.invoiceAddress)

    return (
      Boolean(organization.name) ||
      Boolean(organization.contactName) ||
      Boolean(organization.phone) ||
      deliveryAddressFilled ||
      Boolean(organization.vat) ||
      Boolean(organization.email) ||
      (organization.useSeparateInvoiceAddress && invoiceAddressFilled)
    )
  }, [organization])

  const hasDraft = hasOrganizationDetails || selectedSupplierIds.length > 0 || currentStep > 1
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

  const organizationSectionCount = ORGANIZATION_SECTION_DEFINITIONS.length
  const additionalStepCount = Math.max(steps.length - 1, 0)
  const totalFlowSteps = Math.max(organizationSectionCount + additionalStepCount, 1)

  const showingOrganizationSections = currentStep === 1
  const stepTitle = showingOrganizationSections
    ? organizationSectionProgress.title
    : currentStepDefinition?.title ?? ''
  const stepDescription = showingOrganizationSections
    ? organizationSectionProgress.description
    : currentStepDefinition?.description ?? ''

  const rawDisplayStepNumber = showingOrganizationSections
    ? organizationSectionProgress.index + 1
    : organizationSectionCount + Math.max(currentStep - 1, 0)
  const displayStepNumber = Math.min(Math.max(rawDisplayStepNumber, 1), totalFlowSteps)

  const progress =
    totalFlowSteps <= 1
      ? 100
      : ((displayStepNumber - 1) / (totalFlowSteps - 1)) * 100

  const handleOrganizationUpdate = useCallback((values: OrganizationFormValues) => {
    setOrganization(values)
    if (setupError) {
      setSetupError(null)
    }
  }, [setupError])

  const handleOrganizationComplete = useCallback((values: OrganizationFormValues) => {
    setOrganization(values)
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }, [])

  const handleOrganizationSectionChange = useCallback(
    (progress: OrganizationSectionProgress) => {
      setOrganizationSectionProgress(prev => {
        if (
          prev.index === progress.index &&
          prev.total === progress.total &&
          prev.title === progress.section.title &&
          prev.description === progress.section.description
        ) {
          return prev
        }

        return {
          index: progress.index,
          total: progress.total,
          title: progress.section.title,
          description: progress.section.description
        }
      })
    },
    []
  )

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
        title: 'No suppliers selected',
        description: 'You haven’t connected any suppliers yet.',
        duration: 4000
      })
    }
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }, [selectedSupplierIds.length, toast])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  const handlePreferencesChange = useCallback((prefs: ReviewPreferences) => {
    setPreferences(prefs)
  }, [])

  const handleInviteSupplier = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/suppliers', '_blank', 'noopener')
    }
    toast({
      title: 'Invite suppliers',
      description: 'We opened the suppliers workspace in a new tab.',
      duration: 3500
    })
  }, [toast])

  const exitSetup = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingSkipped', 'true')
    }
    toast({
      title: 'Setup saved for later',
      description: 'You can complete organization setup whenever you’re ready.'
    })
    setAllowNavigation(true)
    setPendingExitAction('skip')
  }, [toast])

  const requestExit = useCallback(() => {
    exitDialogContextRef.current = 'manual'
    setExitDialogContext('manual')
    setExitDialogOpen(true)
  }, [])

  const cancelExitDialog = useCallback(() => {
    if (exitDialogContextRef.current === 'blocked') {
      blocker.reset()
    }
    exitDialogContextRef.current = null
    setExitDialogContext(null)
    setExitDialogOpen(false)
  }, [blocker])

  const confirmExitDialog = useCallback(() => {
    const context = exitDialogContextRef.current
    exitDialogContextRef.current = null
    setExitDialogContext(null)
    setExitDialogOpen(false)

    if (context === 'manual') {
      exitSetup()
    } else if (context === 'blocked') {
      setAllowNavigation(true)
      blocker.proceed()
    }
  }, [blocker, exitSetup])

  const handleExitDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        cancelExitDialog()
      }
    },
    [cancelExitDialog]
  )

  const completeOnboarding = useCallback(async () => {
    if (!user) return
    if (!organization.name.trim()) {
      setCurrentStep(1)
      setSetupError('Add your organization name before finishing setup.')
      return
    }

    setIsCompleting(true)
    setSetupError(null)

    try {
      const trimmedName = organization.name.trim()
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
  }, [organization, preferences, refetch, selectedSupplierIds, toast, user])

  const emphasizedPrimaryClass =
    'justify-center bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)] hover:bg-[var(--brand-accent)]/90'

  const backButtonClass =
    'w-full justify-start text-[color:var(--text-muted)] hover:bg-transparent hover:text-[color:var(--text)] sm:w-auto'

  const exitLinkClass =
    'px-0 text-[12px] font-normal text-[color:var(--text-muted)] underline-offset-4 transition-colors hover:text-[color:var(--text)] hover:underline focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50'

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

  const organizationFooter = ({
    isFirstSection,
    goToPrevious
  }: OrganizationStepFooterContext) => (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
        {!isFirstSection && (
          <Button
            variant="ghost"
            size="lg"
            className={backButtonClass}
            onClick={goToPrevious}
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
        onClick={() => {
          void organizationStepRef.current?.submit()
        }}
        disabled={isCompleting}
      >
        Continue
      </Button>
    </div>
  )

  const supplierFooter = (
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

  const reviewFooter = (
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
        <button type="button" className={exitLinkClass} onClick={requestExit} disabled={isCompleting}>
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
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Finishing…
          </span>
        ) : (
          'Finish setup'
        )}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)]/6 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-4xl px-4">
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">Welcome to Deilda</h1>
          <p className="text-[15px] text-[color:var(--text-muted)]">Let’s get your workspace set up in a few steps.</p>
        </header>

        <div className="relative overflow-hidden rounded-[16px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] shadow-[var(--elev-shadow)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--surface-ring)]/40">
            <div
              className="h-full bg-[var(--brand-accent)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-col gap-7 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                {stepTitle && (
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-[20px] font-semibold text-[color:var(--text)]">
                      {`Step ${displayStepNumber} of ${totalFlowSteps}: ${stepTitle}`}
                    </h2>
                    {stepDescription && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-full p-1 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
                            aria-label={stepDescription}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px] rounded-[12px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-3 py-2 text-left text-[12px] leading-relaxed text-[color:var(--text-muted)]">
                          {stepDescription}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                {currentStep === 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full p-1 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
                        aria-label="Learn how workspaces and organizations connect"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] rounded-[12px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-3 py-2 text-left text-[12px] leading-relaxed text-[color:var(--text-muted)]">
                      You’re creating a workspace. Each workspace is linked to one organization.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {showingOrganizationSections ? (
                <div className="flex justify-center sm:justify-end">
                  <ol className="flex flex-wrap items-center justify-center gap-3 text-[12px] text-[color:var(--text-muted)] sm:justify-end">
                    {ORGANIZATION_SECTION_DEFINITIONS.map((section, index) => {
                      const status =
                        index === organizationSectionProgress.index
                          ? 'current'
                          : index < organizationSectionProgress.index
                            ? 'complete'
                            : 'upcoming'
                      return (
                        <li
                          key={section.id}
                          className={cn(
                            'flex items-center gap-2',
                            status === 'current' && 'text-[color:var(--text)] font-medium',
                            status === 'complete' && 'text-[var(--brand-accent)]'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full border text-[12px]',
                              status === 'complete' &&
                                'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)]',
                              status === 'current' &&
                                'border-[var(--brand-accent)] text-[var(--brand-accent)]',
                              status === 'upcoming' && 'border-[color:var(--surface-ring)]'
                            )}
                          >
                            {status === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
                          </span>
                          <span className="hidden sm:inline">{section.title}</span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ) : (
                <div className="flex justify-center sm:justify-end">
                  <ol className="flex items-center gap-3 text-[12px] text-[color:var(--text-muted)] sm:flex-col sm:items-end">
                    {steps.map(step => {
                      const status =
                        currentStep === step.id ? 'current' : currentStep > step.id ? 'complete' : 'upcoming'
                      return (
                        <li
                          key={step.id}
                          className={cn(
                            'flex items-center gap-2',
                            status === 'current' && 'text-[color:var(--text)] font-medium',
                            status === 'complete' && 'text-[var(--brand-accent)]'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full border text-[12px]',
                              status === 'complete' &&
                                'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)]',
                              status === 'current' &&
                                'border-[var(--brand-accent)] text-[var(--brand-accent)]',
                              status === 'upcoming' && 'border-[color:var(--surface-ring)]'
                            )}
                          >
                            {status === 'complete' ? <Check className="h-4 w-4" /> : step.id}
                          </span>
                          <span className="hidden sm:inline">{step.title}</span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>

            {currentStep === 1 && (
              <OrganizationStep
                ref={organizationStepRef}
                value={organization}
                onUpdate={handleOrganizationUpdate}
                onComplete={handleOrganizationComplete}
                footer={organizationFooter}
                setupError={setupError}
                onSectionChange={handleOrganizationSectionChange}
              />
            )}

            {currentStep === 2 && (
              <SupplierSelectionStep
                suppliers={marketplaceSuppliers}
                selectedIds={selectedSupplierIds}
                onToggle={handleSupplierToggle}
                onInviteSupplier={handleInviteSupplier}
                isLoading={suppliersLoading}
                error={suppliersError instanceof Error ? suppliersError.message : null}
                footer={supplierFooter}
              />
            )}

            {currentStep === 3 && (
              <ReviewStep
                organization={organization}
                suppliers={marketplaceSuppliers}
                selectedSupplierIds={selectedSupplierIds}
                preferences={preferences}
                onPreferencesChange={handlePreferencesChange}
                onEditOrganization={() => setCurrentStep(1)}
                onEditSuppliers={() => setCurrentStep(2)}
                footer={reviewFooter}
              />
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={exitDialogOpen} onOpenChange={handleExitDialogChange}>
        <AlertDialogContent className="sm:max-w-[420px] rounded-[16px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-6 py-6">
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle className="text-[18px] font-semibold text-[color:var(--text)]">
              {exitDialogCopy.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-[color:var(--text-muted)]">
              {exitDialogCopy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel
              onClick={cancelExitDialog}
              className="text-[13px] text-[color:var(--text)] hover:bg-[color:var(--surface-pop-2)]"
            >
              Stay here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExitDialog}
              className={cn(
                'text-[13px]',
                'bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)] hover:bg-[var(--brand-accent)]/90'
              )}
            >
              Leave setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
