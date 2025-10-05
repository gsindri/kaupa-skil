import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { LazyImage } from '@/components/ui/LazyImage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { useToast } from '@/hooks/use-toast'
import { useDeliveryCalculation } from '@/hooks/useDeliveryOptimization'
import { useEmailComposer } from '@/hooks/useEmailComposer'
import { useSuppliers } from '@/hooks/useSuppliers'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/lib/types'
import {
  generateOrderEmailBody,
  generateOrderSubject,
  type EmailLanguage,
} from '@/lib/emailTemplates'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FileDown,
  Info,
  Mail,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'

type SupplierStatus =
  | 'ready'
  | 'pricing_pending'
  | 'minimum_not_met'
  | 'draft_created'
  | 'sent'

type SendMethod = 'default' | 'gmail' | 'outlook' | 'copy' | 'eml'

type ContactInfo = {
  name: string
  email: string
  phone?: string
}

interface SupplierSectionData {
  supplierId: string
  supplierName: string
  items: CartItem[]
  subtotal: number
  deliveryCost: number
  total: number
  hasUnknownPrices: boolean
  logoUrl: string | null
  initials: string
  deliverySummary: string
  deliveryDetail: string
  deliveryNextDay: string | null
  shortfallAmount: number | null
  status: SupplierStatus
  orderEmail: string | null
}

const statusConfig: Record<
  SupplierStatus,
  { label: string; badgeClass: string; tooltip: string }
> = {
  ready: {
    label: 'Ready',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300',
    tooltip: 'All set—opens your email with a draft.',
  },
  pricing_pending: {
    label: 'Pricing pending',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300',
    tooltip: 'We’re missing prices on some items.',
  },
  minimum_not_met: {
    label: 'Minimum not met',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-300',
    tooltip: 'Add items to reach the supplier’s delivery minimum.',
  },
  draft_created: {
    label: 'Draft created',
    badgeClass:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-300',
    tooltip: 'Draft saved—check your email client and press send.',
  },
  sent: {
    label: 'Sent',
    badgeClass:
      'border-muted bg-muted text-muted-foreground dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-200/90',
    tooltip: 'Marked as sent. Supplier will reply directly.',
  },
}

const methodLabels: Record<SendMethod, string> = {
  default: 'Default email app',
  gmail: 'Gmail Web',
  outlook: 'Outlook Web',
  copy: 'Copy to clipboard',
  eml: 'Download .eml',
}

const methodIcons: Record<SendMethod, React.ReactNode> = {
  default: <Mail className="h-4 w-4" />,
  gmail: <Mail className="h-4 w-4" />,
  outlook: <Mail className="h-4 w-4" />,
  copy: <Copy className="h-4 w-4" />,
  eml: <FileDown className="h-4 w-4" />,
}

function formatPriceISK(price: number) {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function buildCollapsedItemLine(item: CartItem) {
  const displayName = item.displayName || item.itemName
  return `${displayName} — ${item.quantity} ${item.unit || ''}`.trim()
}

function DownloadEmlButton({
  subject,
  body,
  fileName,
  onComplete,
}: {
  subject: string
  body: string
  fileName: string
  onComplete?: () => void
}) {
  function handleDownload() {
    const emlContent = `Subject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`
    const blob = new Blob([emlContent], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.eml`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    onComplete?.()
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-[color:var(--surface-pop-2)]/60"
      onClick={handleDownload}
    >
      <FileDown className="h-4 w-4" />
      Download .eml
    </button>
  )
}

interface EditableFieldProps {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  inputType?: string
  supportingText?: string
}

function EditableField({
  label,
  value,
  placeholder,
  onChange,
  inputType = 'text',
  supportingText,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-muted-foreground/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">
            {value ? value : <span className="text-muted-foreground">{placeholder || 'Add details'}</span>}
          </p>
          {supportingText ? (
            <p className="text-xs text-muted-foreground">{supportingText}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(prev => !prev)}
          className="h-8 w-8 p-0 text-muted-foreground"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {label}</span>
        </Button>
      </div>
      {isEditing ? (
        <Input
          type={inputType}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-9"
        />
      ) : null}
    </div>
  )
}

interface EditableContactProps {
  value: ContactInfo
  onChange: (value: ContactInfo) => void
}

function EditableContact({ value, onChange }: EditableContactProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-muted-foreground/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
          <p className="text-sm font-medium text-foreground">
            {value.name || <span className="text-muted-foreground">Add contact</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {value.email || <span className="text-muted-foreground">Add email</span>}
            {value.phone ? ` · ${value.phone}` : null}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(prev => !prev)}
          className="h-8 w-8 p-0 text-muted-foreground"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit contact</span>
        </Button>
      </div>
      {isEditing ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Name"
            value={value.name}
            onChange={event => onChange({ ...value, name: event.target.value })}
            className="h-9"
          />
          <Input
            placeholder="Email"
            type="email"
            value={value.email}
            onChange={event => onChange({ ...value, email: event.target.value })}
            className="h-9"
          />
          <Input
            placeholder="Phone (optional)"
            value={value.phone ?? ''}
            onChange={event => onChange({ ...value, phone: event.target.value })}
            className="h-9 sm:col-span-2"
          />
        </div>
      ) : null}
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, getTotalPrice, getMissingPriceCount } = useCart()
  const { includeVat } = useSettings()
  const { profile } = useAuth()
  const { toast } = useToast()
  const { data: deliveryCalculations, isLoading: isLoadingDelivery } = useDeliveryCalculation()
  const { suppliers: supplierDirectory } = useSuppliers()
  const {
    createEmailData,
    createMailtoLink,
    createGmailLink,
    createOutlookLink,
    copyToClipboard,
  } = useEmailComposer()

  const subtotalPrice = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const totalDeliveryFees = deliveryCalculations?.reduce(
    (sum, calc) => sum + calc.total_delivery_cost,
    0,
  ) ?? 0
  const grandTotal = subtotalPrice + totalDeliveryFees

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplierName: string; items: CartItem[] }>()

    items.forEach(item => {
      const current = groups.get(item.supplierId)
      if (current) {
        current.items.push(item)
      } else {
        groups.set(item.supplierId, {
          supplierName: item.supplierName,
          items: [item],
        })
      }
    })

    return Array.from(groups.entries())
  }, [items])

  const supplierLookup = useMemo(() => {
    const map = new Map<string, { order_email: string | null }>()
    supplierDirectory?.forEach(entry => {
      map.set(entry.id, { order_email: (entry as any).order_email ?? null })
    })
    return map
  }, [supplierDirectory])

  const supplierSections: SupplierSectionData[] = useMemo(() => {
    return supplierGroups.map(([supplierId, group]) => {
      const supplierDelivery = deliveryCalculations?.find(
        calc => calc.supplier_id === supplierId,
      )
      const supplierSubtotal = group.items.reduce((sum, item) => {
        const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
        return price != null ? sum + price * item.quantity : sum
      }, 0)
      const supplierHasUnknownPrices = group.items.some(item => {
        const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
        return price == null
      })
      const deliveryCost = supplierDelivery?.total_delivery_cost ?? 0
      const supplierTotal = supplierSubtotal + deliveryCost

      const [firstItem] = group.items
      const extended = firstItem as CartItem & {
        supplierLogoUrl?: string | null
        logoUrl?: string | null
        supplierLogo?: string | null
      }
      const supplierLogo =
        extended?.supplierLogoUrl ?? extended?.logoUrl ?? extended?.supplierLogo ?? null
      const supplierInitials = (group.supplierName || '??').slice(0, 2).toUpperCase()

      const deliverySummary = supplierDelivery
        ? supplierDelivery.total_delivery_cost > 0
          ? `${formatPriceISK(supplierDelivery.total_delivery_cost)} delivery`
          : 'Delivery included'
        : isLoadingDelivery
          ? 'Delivery calculating…'
          : 'Delivery pending'

      const deliveryDetail = supplierDelivery?.next_delivery_day
        ? `Next delivery: ${supplierDelivery.next_delivery_day}`
        : supplierDelivery?.threshold_amount
          ? `Free at ${formatPriceISK(supplierDelivery.threshold_amount)}`
          : 'Delivery details update at confirmation'

      const shortfallAmount = supplierDelivery?.amount_to_free_delivery ?? null

      const baseStatus: SupplierStatus = supplierHasUnknownPrices
        ? 'pricing_pending'
        : supplierDelivery?.is_under_threshold
          ? 'minimum_not_met'
          : 'ready'

      return {
        supplierId,
        supplierName: group.supplierName,
        items: group.items,
        subtotal: supplierSubtotal,
        deliveryCost,
        total: supplierTotal,
        hasUnknownPrices: supplierHasUnknownPrices,
        logoUrl: supplierLogo,
        initials: supplierInitials,
        deliverySummary,
        deliveryDetail,
        deliveryNextDay: supplierDelivery?.next_delivery_day ?? null,
        shortfallAmount,
        status: baseStatus,
        orderEmail: supplierLookup.get(supplierId)?.order_email ?? null,
      }
    })
  }, [
    supplierGroups,
    deliveryCalculations,
    includeVat,
    isLoadingDelivery,
    supplierLookup,
  ])

  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({})
  const [statusOverrides, setStatusOverrides] = useState<Record<string, SupplierStatus>>({})
  const [preferredMethods, setPreferredMethods] = useState<Record<string, SendMethod>>({})
  const [languageOverrides, setLanguageOverrides] = useState<Record<string, EmailLanguage>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({})
  const [deliveryAddresses, setDeliveryAddresses] = useState<Record<string, string>>({})
  const [contacts, setContacts] = useState<Record<string, ContactInfo>>({})
  const [markAsSentState, setMarkAsSentState] = useState<Record<string, boolean>>({})
  const [modalSupplierId, setModalSupplierId] = useState<string | null>(null)
  const [modalTab, setModalTab] = useState<'summary' | 'email'>('summary')
  const [allowPendingSend, setAllowPendingSend] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('checkout-preferred-methods')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, SendMethod>
        setPreferredMethods(parsed)
      } catch (error) {
        console.warn('Failed to parse preferred methods', error)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'checkout-preferred-methods',
      JSON.stringify(preferredMethods),
    )
  }, [preferredMethods])

  useEffect(() => {
    const supplierIds = new Set(supplierSections.map(section => section.supplierId))

    setExpandedSuppliers(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = false
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setLanguageOverrides(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = 'en'
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setNotes(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = ''
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setDeliveryDates(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = section.deliveryNextDay ?? ''
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setDeliveryAddresses(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = ''
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setContacts(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = {
            name: profile?.full_name ?? '',
            email: profile?.email ?? '',
          }
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setStatusOverrides(prev => {
      const next = { ...prev }
      let changed = false
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setMarkAsSentState(prev => {
      const next = { ...prev }
      let changed = false
      supplierSections.forEach(section => {
        if (!(section.supplierId in next)) {
          next[section.supplierId] = false
          changed = true
        }
      })
      Object.keys(next).forEach(id => {
        if (!supplierIds.has(id)) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [supplierSections, profile])

  const getDisplayStatus = useCallback((supplierId: string, baseStatus: SupplierStatus) => {
    const override = statusOverrides[supplierId]
    if (!override) {
      return baseStatus
    }
    if (override === 'sent') {
      return 'sent'
    }
    if (override === 'draft_created' && baseStatus !== 'sent') {
      return baseStatus === 'minimum_not_met' ? baseStatus : 'draft_created'
    }
    return override
  }, [statusOverrides])

  const sortedSupplierSections = useMemo(() => {
    const order: SupplierStatus[] = [
      'ready',
      'pricing_pending',
      'minimum_not_met',
      'draft_created',
      'sent',
    ]

    return [...supplierSections].sort((a, b) => {
      const statusA = getDisplayStatus(a.supplierId, a.status)
      const statusB = getDisplayStatus(b.supplierId, b.status)
      return order.indexOf(statusA) - order.indexOf(statusB)
    })
  }, [getDisplayStatus, supplierSections])

  const deliveryDisplay = isLoadingDelivery
    ? 'Calculating…'
    : deliveryCalculations
      ? totalDeliveryFees > 0
        ? formatPriceISK(totalDeliveryFees)
        : 'Included'
      : '—'

  const grandTotalDisplay = missingPriceCount > 0 && grandTotal === 0
    ? 'Pending'
    : formatPriceISK(grandTotal)

  const modalSupplier = modalSupplierId
    ? supplierSections.find(section => section.supplierId === modalSupplierId)
    : null
  const modalLanguage = modalSupplierId
    ? languageOverrides[modalSupplierId] ?? 'en'
    : 'en'
  const modalNotes = modalSupplierId ? notes[modalSupplierId] ?? '' : ''
  const modalDeliveryDate = modalSupplierId ? deliveryDates[modalSupplierId] ?? '' : ''
  const modalDeliveryAddress = modalSupplierId
    ? deliveryAddresses[modalSupplierId] ?? ''
    : ''
  const modalContact = modalSupplierId
    ? contacts[modalSupplierId] ?? { name: '', email: '' }
    : { name: '', email: '' }
  const modalPreferredMethod = modalSupplierId
    ? preferredMethods[modalSupplierId] ?? 'default'
    : 'default'

  const emailData = modalSupplier
    ? createEmailData(
      modalSupplier.supplierName,
      modalSupplier.items,
      modalSupplier.subtotal,
      {
        includeVat,
        deliveryDate: modalDeliveryDate || undefined,
        notes: modalNotes || undefined,
      },
    )
    : null

  const emailSubject = emailData
    ? generateOrderSubject(emailData.poNumber, emailData.organizationName, modalLanguage)
    : ''
  const emailBody = emailData
    ? generateOrderEmailBody(
      {
        ...emailData,
        deliveryAddress: modalDeliveryAddress || undefined,
        contactName: modalContact.name || undefined,
        contactEmail: modalContact.email || undefined,
        contactPhone: modalContact.phone || undefined,
      },
      modalLanguage,
    )
    : ''

  const handleOpenModal = (supplierId: string, tab: 'summary' | 'email' = 'summary') => {
    setModalSupplierId(supplierId)
    setModalTab(tab)
    setAllowPendingSend(false)
  }

  const handleCloseModal = () => {
    setModalSupplierId(null)
    setAllowPendingSend(false)
  }

  const handleToggleExpanded = (supplierId: string) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }))
  }

  const handleSetPreferredMethod = (supplierId: string, method: SendMethod) => {
    setPreferredMethods(prev => ({
      ...prev,
      [supplierId]: method,
    }))
  }

  const handleSendClick = (supplierId: string) => {
    handleOpenModal(supplierId)
  }

  const handleDownloadEml = () => {
    if (!modalSupplier || !emailData) return
    const fileName = `${modalSupplier.supplierName.replace(/\s+/g, '_')}-${emailData.poNumber}`
    const emlContent = `Subject: ${emailSubject}\nContent-Type: text/plain; charset=utf-8\n\n${emailBody}`
    const blob = new Blob([emlContent], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.eml`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatusOverrides(prev => ({
      ...prev,
      [modalSupplier.supplierId]: 'draft_created',
    }))
    setAllowPendingSend(true)
    toast({
      title: 'Draft created',
      description: 'Draft created—check your downloads and open it in your mail client.',
    })
  }

  const handleOpenEmail = (method?: SendMethod) => {
    if (!modalSupplier || !emailData) return
    const supplierId = modalSupplier.supplierId
    const supplierEmail = modalSupplier.orderEmail
    const language = modalLanguage
    const selectedMethod = method ?? (preferredMethods[supplierId] ?? 'default')

    if (!supplierEmail && selectedMethod !== 'copy' && selectedMethod !== 'eml') {
      toast({
        title: 'Supplier email missing',
        description: 'Add an order email for this supplier to send from here.',
        variant: 'destructive',
      })
      return
    }

    if (selectedMethod === 'default') {
      if (supplierEmail) {
        const link = createMailtoLink(supplierEmail, emailData, language)
        window.location.href = link
      }
    } else if (selectedMethod === 'gmail') {
      if (supplierEmail) {
        const link = createGmailLink(supplierEmail, emailData, language)
        window.open(link, '_blank', 'noopener')
      }
    } else if (selectedMethod === 'outlook') {
      if (supplierEmail) {
        const link = createOutlookLink(supplierEmail, emailData, language)
        window.open(link, '_blank', 'noopener')
      }
    } else if (selectedMethod === 'copy') {
      copyToClipboard(emailData, language)
    } else if (selectedMethod === 'eml') {
      handleDownloadEml()
      return
    }

    setStatusOverrides(prev => ({
      ...prev,
      [supplierId]: 'draft_created',
    }))
    toast({
      title: 'Draft created',
      description: 'Draft created—check your email and press send.',
    })
    handleCloseModal()
  }

  const handleMarkAsSent = (supplierId: string, checked: boolean) => {
    setMarkAsSentState(prev => ({
      ...prev,
      [supplierId]: checked,
    }))
    setStatusOverrides(prev => ({
      ...prev,
      [supplierId]: checked ? 'sent' : 'draft_created',
    }))
  }

  const handleAddToMinimum = (supplier: SupplierSectionData) => {
    if (!supplier.shortfallAmount) return
    toast({
      title: 'Minimum not met',
      description: `Add ${formatPriceISK(Math.ceil(supplier.shortfallAmount))} more from ${supplier.supplierName} to unlock sending.`,
    })
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              Your cart is empty. Add items to review supplier emails.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/catalog')}>
            Browse catalog
          </Button>
        </div>
        <Card className="overflow-hidden text-center">
          <CardContent className="flex flex-col items-center gap-6 py-16">
            <img src="/unavailable.svg" alt="" className="h-32 w-32 object-contain" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">Nothing to review yet</p>
              <p className="text-sm text-muted-foreground">
                Add items to your cart and return here to draft supplier emails.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/catalog')} className="inline-flex items-center gap-2">
                Browse catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/orders')}>
                Back to cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              Your cart is split by supplier. Each email is one order.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Return to cart
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {sortedSupplierSections.map(section => {
              const status = getDisplayStatus(section.supplierId, section.status)
              const isExpanded = expandedSuppliers[section.supplierId]
              const language = languageOverrides[section.supplierId] ?? 'en'
              const preferredMethod = preferredMethods[section.supplierId] ?? 'default'
              const collapsedItems = section.items.slice(0, isExpanded ? section.items.length : 2)
              const pendingPrices = section.items.filter(item => {
                const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                return price == null
              })

              const subtotalDisplay = section.hasUnknownPrices
                ? 'Pending'
                : section.subtotal > 0
                  ? formatPriceISK(section.subtotal)
                  : '0 kr.'
              const deliveryDisplayPerSupplier = section.hasUnknownPrices && section.deliveryCost === 0
                ? 'Pending'
                : section.deliveryCost > 0
                  ? formatPriceISK(section.deliveryCost)
                  : 'Included'
              const totalDisplay = section.hasUnknownPrices
                ? 'Pending'
                : section.total > 0
                  ? formatPriceISK(section.total)
                  : 'Pending'

              const badge = statusConfig[status]

              const supplierEmailMissing = !section.orderEmail
              const isPricingPending = status === 'pricing_pending'
              const isMinimumNotMet = status === 'minimum_not_met'

              return (
                <section
                  key={section.supplierId}
                  className={cn(
                    'overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm transition-opacity',
                    status === 'sent' ? 'opacity-60 grayscale-[0.2]' : 'opacity-100',
                  )}
                  id={`supplier-${section.supplierId}`}
                >
                  <header className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {section.logoUrl ? (
                          <AvatarImage
                            src={section.logoUrl}
                            alt={`${section.supplierName} logo`}
                            className="object-contain"
                          />
                        ) : (
                          <AvatarFallback className="text-sm font-medium">
                            {section.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {section.supplierName || 'Supplier'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {section.items.length} item{section.items.length === 1 ? '' : 's'} · {section.deliverySummary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToggleGroup
                        type="single"
                        value={language}
                        onValueChange={value => {
                          if (!value) return
                          setLanguageOverrides(prev => ({
                            ...prev,
                            [section.supplierId]: value as EmailLanguage,
                          }))
                        }}
                        size="sm"
                        className="rounded-full bg-muted px-1 py-1 text-xs"
                      >
                        <ToggleGroupItem value="is" className="px-2 py-1 text-xs">IS</ToggleGroupItem>
                        <ToggleGroupItem value="en" className="px-2 py-1 text-xs">EN</ToggleGroupItem>
                      </ToggleGroup>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className={cn('px-2 py-1 text-xs font-semibold', badge.badgeClass)}>
                            {badge.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{badge.tooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                  </header>

                  <div className="space-y-4 px-4 py-4">
                    <p className="text-xs text-muted-foreground">
                      Subtotal: {subtotalDisplay} · Delivery: {deliveryDisplayPerSupplier} · Est. total: {totalDisplay}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {isMinimumNotMet && section.shortfallAmount ? (
                        <Button
                          type="button"
                          size="lg"
                          className="flex-1 justify-center gap-2"
                          variant="secondary"
                          onClick={() => handleAddToMinimum(section)}
                        >
                          Add {formatPriceISK(Math.ceil(section.shortfallAmount))} to enable sending
                        </Button>
                      ) : (
                        <Tooltip open={isPricingPending ? undefined : false}>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button
                                type="button"
                                size="lg"
                                className="w-full justify-center gap-2"
                                onClick={() => handleSendClick(section.supplierId)}
                                disabled={isMinimumNotMet || (isPricingPending && !allowPendingSend)}
                              >
                                <Mail className="h-4 w-4" />
                                Send order to {section.supplierName}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {isPricingPending ? (
                            <TooltipContent className="max-w-xs text-sm">
                              Waiting for price on {pendingPrices.length} item{pendingPrices.length === 1 ? '' : 's'}.
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 gap-2 px-3 text-xs text-muted-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            More options
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {(Object.keys(methodLabels) as SendMethod[]).map(method => (
                            <DropdownMenuItem
                              key={method}
                              onSelect={() => handleSetPreferredMethod(section.supplierId, method)}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-muted-foreground">{methodIcons[method]}</span>
                              <span className="flex-1">{methodLabels[method]}</span>
                              {preferredMethod === method ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 p-3">
                        {collapsedItems.map(item => (
                          <p key={item.supplierItemId} className="truncate text-sm text-foreground">
                            • {buildCollapsedItemLine(item)}
                          </p>
                        ))}
                        {section.items.length > 2 && !isExpanded ? (
                          <p className="text-xs text-muted-foreground">
                            +{section.items.length - 2} more item{section.items.length - 2 === 1 ? '' : 's'} hidden
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                          onClick={() => handleToggleExpanded(section.supplierId)}
                        >
                          {isExpanded ? 'Hide details' : 'View details'}
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-3">
                          {section.items.map(item => {
                            const displayName = item.displayName || item.itemName
                            const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                            const unitLabel = item.unit ? `per ${item.unit}` : 'per unit'
                            const pricePerUnit = unitPrice != null ? formatPriceISK(unitPrice) : 'Pending'
                            const lineTotal = unitPrice != null ? unitPrice * item.quantity : null
                            const lineTotalDisplay = lineTotal != null ? formatPriceISK(lineTotal) : 'Pending'

                            return (
                              <div
                                key={item.supplierItemId}
                                className="flex items-center gap-3 rounded-xl border border-muted/40 bg-background/90 p-3"
                              >
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                  {item.image ? (
                                    <LazyImage
                                      src={item.image}
                                      alt={displayName}
                                      className="h-full w-full"
                                      imgClassName="object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} × {pricePerUnit} {unitLabel}
                                  </p>
                                  {item.packSize ? (
                                    <p className="text-xs text-muted-foreground">Pack: {item.packSize}</p>
                                  ) : null}
                                </div>
                                <div className="text-sm font-medium tabular-nums text-foreground">{lineTotalDisplay}</div>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>

                    {status === 'draft_created' || status === 'sent' ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`mark-sent-${section.supplierId}`}
                            checked={markAsSentState[section.supplierId]}
                            onCheckedChange={checked =>
                              handleMarkAsSent(section.supplierId, Boolean(checked))
                            }
                          />
                          <label htmlFor={`mark-sent-${section.supplierId}`} className="text-sm text-foreground">
                            Mark as sent
                          </label>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                          onClick={() => handleOpenModal(section.supplierId)}
                        >
                          Add supplier note
                        </Button>
                      </div>
                    ) : null}

                    {supplierEmailMissing ? (
                      <div className="flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        Add an order email in supplier settings to send directly from here.
                      </div>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm">
              <div className="space-y-3">
                {sortedSupplierSections.map(section => {
                  const status = getDisplayStatus(section.supplierId, section.status)
                  const badge = statusConfig[status]
                  const summaryDisplay = section.hasUnknownPrices
                    ? 'Pending'
                    : section.total > 0
                      ? formatPriceISK(section.total)
                      : 'Pending'
                  return (
                    <div key={section.supplierId} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{section.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{badge.label}</p>
                      </div>
                      <p className="text-sm font-medium tabular-nums text-foreground">{summaryDisplay}</p>
                    </div>
                  )
                })}
                <hr className="border-dashed border-border/60" />
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Delivery fees</span>
                    <span className="font-medium text-foreground">{deliveryDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>VAT</span>
                    <span className="font-medium text-foreground">
                      {includeVat ? 'Included' : 'Calculated at settlement'}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {missingPriceCount > 0 ? 'Estimated total' : 'Estimated total'}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{grandTotalDisplay}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/checkout/confirmation')}
                >
                  Proceed to checkout
                </Button>
              </div>
            </div>
          </aside>
        </div>

        <Dialog open={Boolean(modalSupplier)} onOpenChange={open => (open ? null : handleCloseModal())}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview order email</DialogTitle>
              {modalSupplier ? (
                <DialogDescription>
                  Review delivery details and the email draft before sending to {modalSupplier.supplierName}.
                </DialogDescription>
              ) : null}
            </DialogHeader>

            {modalSupplier ? (
              <div className="space-y-4">
                <Tabs value={modalTab} onValueChange={value => setModalTab(value as 'summary' | 'email')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EditableField
                        label="Delivery date"
                        value={modalDeliveryDate}
                        placeholder="Set a delivery date"
                        onChange={value =>
                          setDeliveryDates(prev => ({
                            ...prev,
                            [modalSupplier.supplierId]: value,
                          }))
                        }
                      />
                      <EditableField
                        label="Delivery address"
                        value={modalDeliveryAddress}
                        placeholder="Add delivery address"
                        onChange={value =>
                          setDeliveryAddresses(prev => ({
                            ...prev,
                            [modalSupplier.supplierId]: value,
                          }))
                        }
                      />
                    </div>
                    <EditableContact
                      value={modalContact}
                      onChange={value =>
                        setContacts(prev => ({
                          ...prev,
                          [modalSupplier.supplierId]: value,
                        }))
                      }
                    />
                    <div className="space-y-3 rounded-xl border border-dashed border-muted-foreground/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Items ({modalSupplier.items.length})</p>
                        <p className="text-sm text-muted-foreground">Estimated total {grandTotalDisplay}</p>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {modalSupplier.items.map(item => (
                          <li key={item.supplierItemId} className="flex items-start justify-between gap-3">
                            <span className="text-foreground">{item.displayName || item.itemName}</span>
                            <span>
                              {item.quantity} ×{' '}
                              {(() => {
                                const price = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
                                return price != null ? formatPriceISK(price) : 'Pending'
                              })()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="supplier-notes" className="text-sm font-medium text-foreground">
                        Notes (optional)
                      </label>
                      <Textarea
                        id="supplier-notes"
                        value={modalNotes}
                        onChange={event =>
                          setNotes(prev => ({
                            ...prev,
                            [modalSupplier.supplierId]: event.target.value,
                          }))
                        }
                        placeholder="Add special handling or reminders"
                        className="min-h-[88px]"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="email">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p>
                        <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground">
                          {emailSubject}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body preview</p>
                        <ScrollArea className="max-h-64 rounded-lg border border-border/60 bg-muted/10">
                          <pre className="whitespace-pre-wrap px-3 py-3 text-sm text-foreground">{emailBody}</pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    More options
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => handleOpenEmail('gmail')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Gmail Web
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleOpenEmail('outlook')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Outlook Web
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleOpenEmail('copy')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Copy to clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleDownloadEml}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FileDown className="h-4 w-4" />
                    Download .eml
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                onClick={() => handleOpenEmail()}
                disabled={
                  modalSupplier?.status === 'minimum_not_met' ||
                  (modalSupplier?.status === 'pricing_pending' && !allowPendingSend)
                }
              >
                Open email ({methodLabels[modalPreferredMethod]})
              </Button>
            </DialogFooter>
            {modalSupplier?.status === 'pricing_pending' && !allowPendingSend ? (
              <div className="px-1 pb-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-xs"
                  onClick={() => setAllowPendingSend(true)}
                >
                  Send anyway
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
