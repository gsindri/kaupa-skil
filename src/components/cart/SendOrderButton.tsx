import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Mail, Copy, CheckCircle2, AlertCircle, Star } from 'lucide-react'
import { useEmailComposer } from '@/hooks/useEmailComposer'
import { GmailAuthButton } from '@/components/gmail/GmailAuthButton'
import { OutlookAuthButton } from '@/components/cart/OutlookAuthButton'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useBasket } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { useOrders } from '@/hooks/useOrders'
import { useAuth } from '@/contexts/useAuth'
import { MarkAsSentDialog } from './MarkAsSentDialog'
import type { CartItem } from '@/lib/types'
import type { EmailLanguage } from '@/lib/emailTemplates'

interface SendOrderButtonProps {
  supplierId: string
  supplierName: string
  supplierEmail?: string | null
  supplierLogoUrl?: string | null
  cartItems: CartItem[]
  subtotal: number
  minOrderValue?: number
}

export function SendOrderButton({
  supplierId,
  supplierName,
  supplierEmail,
  supplierLogoUrl,
  cartItems,
  subtotal,
  minOrderValue = 0
}: SendOrderButtonProps) {
  const [language, setLanguage] = useState<EmailLanguage>('en')
  const [isGmailAuthorized, setIsGmailAuthorized] = useState(false)
  const [isOutlookAuthorized, setIsOutlookAuthorized] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSendMethod, setPendingSendMethod] = useState<string | null>(null)
  const { toast } = useToast()
  const { items, removeItem } = useBasket()
  const { createOrder, addOrderLine } = useOrders()
  const { profile } = useAuth()
  const {
    createEmailData,
    createMailtoLink,
    createGmailLink,
    createOutlookLink,
    copyToClipboard,
    generatePONumber
  } = useEmailComposer()
  const { includeVat } = useSettings()

  const meetsMinimum = subtotal >= minOrderValue
  const shortfall = minOrderValue - subtotal

  useEffect(() => {
    checkGmailAuth()
    checkOutlookAuth()
  }, [])

  async function checkGmailAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('gmail_authorized')
        .eq('id', user.id)
        .single()

      setIsGmailAuthorized(profile?.gmail_authorized || false)
    } catch (error) {
      console.error('Error checking Gmail auth:', error)
    }
  }

  async function checkOutlookAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('outlook_authorized')
        .eq('id', user.id)
        .single()

      setIsOutlookAuthorized(profile?.outlook_authorized || false)
    } catch (error) {
      console.error('Error checking Outlook auth:', error)
    }
  }

  const emailData = createEmailData(supplierName, cartItems, subtotal, { includeVat })

  const handleSendEmail = async (method: 'mailto' | 'gmail' | 'outlook' | 'gmail-draft' | 'outlook-draft' | 'clipboard') => {
    if (!supplierEmail && method !== 'clipboard') {
      alert(language === 'is' ? 'Netfang ekki stillt fyrir þennan birgja' : 'Email not configured for this supplier')
      return
    }

    // Gmail draft auto-clears cart on success
    if (method === 'gmail-draft') {
      const success = await handleCreateGmailDraft()
      if (success) {
        await handleMarkAsSent('gmail_draft')
      }
      return
    }

    // Outlook draft auto-clears cart on success
    if (method === 'outlook-draft') {
      const success = await handleCreateOutlookDraft()
      if (success) {
        await handleMarkAsSent('outlook_draft')
      }
      return
    }

    // For other methods, open the email client then show confirmation dialog
    let link = ''
    if (method === 'mailto') {
      link = createMailtoLink(supplierEmail!, emailData, language)
      window.location.href = link
    } else if (method === 'gmail') {
      link = createGmailLink(supplierEmail!, emailData, language)
      window.open(link, '_blank')
    } else if (method === 'outlook') {
      link = createOutlookLink(supplierEmail!, emailData, language)
      window.open(link, '_blank')
    } else if (method === 'clipboard') {
      copyToClipboard(emailData, language)
    }

    // Show confirmation dialog
    setPendingSendMethod(method)
    setShowConfirmDialog(true)
  }

  async function handleCreateGmailDraft(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('create-gmail-draft', {
        body: {
          ...emailData,
          supplierEmail,
          language,
        },
      })

      if (error) throw error

      toast({
        title: language === 'is' ? 'Drög búin til' : 'Draft Created',
        description: language === 'is'
          ? 'Gmail drög hafa verið búin til og pöntun vistuð.'
          : 'Gmail draft has been created and order saved.',
      })

      if (data?.draftUrl) {
        window.open(data.draftUrl, '_blank')
      }

      return true
    } catch (error) {
      console.error('Failed to create Gmail draft:', error)
      toast({
        title: language === 'is' ? 'Villa' : 'Error',
        description: language === 'is'
          ? 'Ekki tókst að búa til Gmail drög. Vinsamlegast tengdu Gmail fyrst.'
          : 'Failed to create Gmail draft. Please connect Gmail first.',
        variant: 'destructive',
      })
      return false
    }
  }

  async function handleCreateOutlookDraft(): Promise<boolean> {
    try {
      const subject = `PO-${generatePONumber()} - Order from ${profile?.full_name || 'Your Company'}`
      const body = `Order details:\n\nSupplier: ${supplierName}\n\n` +
        cartItems.map(item => `${item.itemName} - ${item.quantity} x ${item.packSize}`).join('\n') +
        `\n\nSubtotal: ${subtotal.toLocaleString()} kr.`

      const { data, error } = await supabase.functions.invoke('create-outlook-draft', {
        body: {
          to: supplierEmail!,
          subject,
          body,
        },
      })

      if (error) throw error

      toast({
        title: language === 'is' ? 'Drög búin til' : 'Draft Created',
        description: language === 'is'
          ? 'Outlook drög hafa verið búin til og pöntun vistuð.'
          : 'Outlook draft has been created and order saved.',
      })

      if (data?.webLink) {
        window.open(data.webLink, '_blank')
      }

      return true
    } catch (error) {
      console.error('Failed to create Outlook draft:', error)
      toast({
        title: language === 'is' ? 'Villa' : 'Error',
        description: language === 'is'
          ? 'Ekki tókst að búa til Outlook drög. Vinsamlegast tengdu Outlook fyrst.'
          : 'Failed to create Outlook draft. Please connect Outlook first.',
        variant: 'destructive',
      })
      return false
    }
  }

  async function handleMarkAsSent(sendMethod: string) {
    try {
      // Create order record
      const orderData = await createOrder.mutateAsync({
        supplier_id: supplierId,
        order_number: generatePONumber(),
        order_date: new Date().toISOString(),
        status: 'sent',
        vat_included: true,
        currency: 'ISK'
      })

      // Add order lines
      for (const item of cartItems) {
        const orderLine = {
          order_id: orderData.id,
          supplier_product_id: item.id,
          pack_size: item.packSize || null,
          quantity_packs: item.quantity,
          unit_price_per_pack: item.unitPriceExVat ?? null,
          line_total: item.unitPriceExVat ? item.unitPriceExVat * item.quantity : null,
          currency: 'ISK',
          vat_included: false
        }
        await addOrderLine.mutateAsync(orderLine)
      }

      // Clear cart items for this supplier
      cartItems.forEach(item => {
        removeItem(item.id)
      })

      toast({
        title: language === 'is' ? 'Pöntun send' : 'Order Sent',
        description: language === 'is'
          ? `Pöntun til ${supplierName} hefur verið vistuð og fjarlægð úr körfu.`
          : `Order to ${supplierName} has been saved and removed from cart.`,
      })

      setShowConfirmDialog(false)
      setPendingSendMethod(null)
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: language === 'is' ? 'Villa' : 'Error',
        description: language === 'is'
          ? 'Ekki tókst að vista pöntun'
          : 'Failed to save order',
        variant: 'destructive',
      })
    }
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'is' : 'en')
  }

  // ... (keep existing logic/hooks)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Auth buttons (hidden if authorized usually, or small) */}
        {!isGmailAuthorized && <div className="hidden"><GmailAuthButton /></div>}
        {!isOutlookAuthorized && <div className="hidden"><OutlookAuthButton /></div>}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => handleSendEmail('clipboard')}
                disabled={!meetsMinimum}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" size="sm" className="h-9 gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Review
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                onClick={() => handleSendEmail('gmail-draft')}
                disabled={!meetsMinimum || !supplierEmail}
              >
                <Mail className="h-4 w-4" />
                Gmail
              </Button>
            </TooltipTrigger>
            {!meetsMinimum && (
              <TooltipContent>Min order not met</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-2 bg-[#0078D4] hover:bg-[#006cbd] text-white"
                onClick={() => handleSendEmail('outlook-draft')}
                disabled={!meetsMinimum || !supplierEmail}
              >
                <Mail className="h-4 w-4" />
                Outlook
              </Button>
            </TooltipTrigger>
            {!meetsMinimum && (
              <TooltipContent>Min order not met</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <MarkAsSentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => handleMarkAsSent(pendingSendMethod || 'unknown')}
        language={language}
        supplierName={supplierName}
      />
    </>
  )
}
