import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OrganizationStep, type OrganizationStepHandle, type OrganizationFormValues } from './steps/OrganizationStep'
import { SupplierSelectionStep, type SupplierOption } from './steps/SupplierSelectionStep'
import { ReviewStep, type ReviewPreferences } from './steps/ReviewStep'
import { useLocaleDefaults } from '@/utils/locale'
import type { Database } from '@/lib/types'

const DRAFT_STORAGE_KEY = 'workspace_setup_draft'
const STATUS_STORAGE_KEY = 'workspace_setup_status'
const PREFERENCES_STORAGE_KEY = 'workspace_preferences'
const TOTAL_STEPS = 3

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

const EMPTY_ORGANIZATION: OrganizationFormValues = {
  name: '',
  contactName: '',
  phone: '',
  address: '',
  vat: ''
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
  const { toast } = useToast()
  const { user, profile, profileLoading, refetch } = useAuth()
  const { language: defaultLanguage, currency: defaultCurrency } = useLocaleDefaults()

  const [currentStep, setCurrentStep] = useState(1)
  const [organization, setOrganization] = useState<OrganizationFormValues>(EMPTY_ORGANIZATION)
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
  const [preferences, setPreferences] = useState<ReviewPreferences>({
    language: defaultLanguage,
    currency: defaultCurrency
  })
  const [setupError, setSetupError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [allowNavigation, setAllowNavigation] = useState(false)

  const organizationStepRef = useRef<OrganizationStepHandle>(null)

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
    if (profile?.tenant_id) {
      toast({
        title: 'Setup already complete!',
        description: 'Your workspace is ready to use.'
      })
      navigate('/')
    }
  }, [profile, profileLoading, navigate, toast])

  useEffect(() => {
    if (typeof window === 'undefined' || draftLoaded) return
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<DraftState>
        if (parsed.organization) {
          setOrganization({ ...EMPTY_ORGANIZATION, ...parsed.organization })
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
    return (
      Boolean(organization.name) ||
      Boolean(organization.contactName) ||
      Boolean(organization.phone) ||
      Boolean(organization.address) ||
      Boolean(organization.vat)
    )
  }, [organization])

  const hasDraft = hasOrganizationDetails || selectedSupplierIds.length > 0 || currentStep > 1
  const shouldBlockNavigation = !allowNavigation && !isCompleting && hasDraft
  const blocker = useBlocker(shouldBlockNavigation)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm('Progress saved. Leave setup?')
      if (confirmLeave) {
        setAllowNavigation(true)
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  useEffect(() => {
    if (!shouldBlockNavigation) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = 'Progress saved. Leave setup?'
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlockNavigation])

  const progress = (currentStep / TOTAL_STEPS) * 100

  const handleOrganizationUpdate = useCallback((values: OrganizationFormValues) => {
    setOrganization(values)
    if (setupError) {
      setSetupError(null)
    }
  }, [setupError])

  const handleOrganizationComplete = useCallback(
    (values: OrganizationFormValues) => {
      setOrganization(values)
      setCurrentStep(2)
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
    setCurrentStep(3)
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

  const handleSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingSkipped', 'true')
    }
    toast({
      title: 'Setup saved for later',
      description: 'You can complete organization setup whenever you’re ready.'
    })
    setAllowNavigation(true)
    if (onSkip) {
      onSkip()
    } else {
      navigate('/')
    }
  }, [navigate, onSkip, toast])

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

      if (onComplete) {
        onComplete()
      } else {
        navigate('/')
      }
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
  }, [navigate, onComplete, organization, preferences, refetch, selectedSupplierIds, toast, user])

  const emphasizedPrimaryClass =
    'justify-center bg-[var(--brand-accent)] text-[color:var(--brand-accent-fg)] hover:bg-[var(--brand-accent)]/90'

  const backButtonClass =
    'justify-center text-[color:var(--text-muted)] hover:bg-transparent hover:text-[color:var(--text)] sm:w-auto'

  const skipLinkClass =
    'text-[13px] text-[color:var(--text-muted)] underline-offset-4 transition-colors hover:text-[color:var(--text)] hover:underline disabled:pointer-events-none disabled:opacity-50'

  const organizationFooter = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="lg" className={backButtonClass} disabled>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          size="lg"
          className={emphasizedPrimaryClass}
          onClick={() => organizationStepRef.current?.submit()}
          disabled={isCompleting}
        >
          Continue
        </Button>
      </div>
      <div className="flex justify-end">
        <button type="button" className={skipLinkClass} onClick={handleSkip}>
          Skip for now
        </button>
      </div>
    </div>
  )

  const supplierFooter = (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="lg"
        className={backButtonClass}
        onClick={handleBack}
        disabled={isCompleting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <span className="text-center text-[13px] text-[color:var(--text-muted)]">
          {selectedSupplierIds.length} selected
        </span>
        <Button
          size="lg"
          className={emphasizedPrimaryClass}
          onClick={handleSupplierContinue}
          disabled={isCompleting}
        >
          Continue
        </Button>
      </div>
    </div>
  )

  const reviewFooter = (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="lg"
        className={backButtonClass}
        onClick={handleBack}
        disabled={isCompleting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          size="lg"
          className={emphasizedPrimaryClass}
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
      <div className="flex justify-end">
        <button type="button" className={skipLinkClass} onClick={handleSkip} disabled={isCompleting}>
          Skip for now
        </button>
      </div>
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

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-[color:var(--text)]">{steps[currentStep - 1]?.title}</h2>
                <p className="text-[14px] text-[color:var(--text-muted)]">{steps[currentStep - 1]?.description}</p>
              </div>
              <ol className="flex items-center justify-center gap-3 text-[12px] text-[color:var(--text-muted)] sm:flex-col sm:items-end">
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

            {currentStep === 1 && (
              <OrganizationStep
                ref={organizationStepRef}
                value={organization}
                onUpdate={handleOrganizationUpdate}
                onComplete={handleOrganizationComplete}
                footer={organizationFooter}
                setupError={setupError}
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
    </div>
  )
}
