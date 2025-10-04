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
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useBasket } from '@/contexts/useBasket'
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

  const meetsMinimum = subtotal >= minOrderValue
  const shortfall = minOrderValue - subtotal

  useEffect(() => {
    checkGmailAuth()
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

  const emailData = createEmailData(supplierName, cartItems, subtotal)

  const handleSendEmail = async (method: 'mailto' | 'gmail' | 'outlook' | 'gmail-draft' | 'clipboard') => {
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
          unit_price_per_pack: item.unitPriceExVat || 0,
          line_total: (item.unitPriceExVat || 0) * item.quantity,
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

  return (
    <>
      <div className="space-y-4 pt-4 border-t">
        {/* Header with supplier info and language toggle */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={supplierLogoUrl || undefined} alt={supplierName} />
            <AvatarFallback>{supplierName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 font-medium">{supplierName}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 px-3"
          >
            {language === 'en' ? '🇬🇧 EN' : '🇮🇸 IS'}
          </Button>
          {meetsMinimum ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {language === 'is' ? 'Tilbúið' : 'Ready'}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {minOrderValue > 0 && `+${(minOrderValue - subtotal).toLocaleString()} kr.`}
            </Badge>
          )}
        </div>

        {/* Gmail Auth Button (if not authorized) */}
        {!isGmailAuthorized && <GmailAuthButton />}

        {/* Primary Send Options */}
        <div className="space-y-2">
          <TooltipProvider>
            {isGmailAuthorized && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleSendEmail('gmail-draft')}
                    disabled={!meetsMinimum || !supplierEmail}
                    className="w-full"
                    size="default"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {language === 'is' ? 'Búa til Gmail drög' : 'Create Gmail Draft'}
                  </Button>
                </TooltipTrigger>
                {!meetsMinimum && (
                  <TooltipContent>
                    <p>
                      {language === 'is' 
                        ? `Bæta við ${shortfall.toLocaleString('is-IS')} kr. til að ná lágmarki`
                        : `Add ${shortfall.toLocaleString('en-US')} kr. more to meet minimum`
                      }
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSendEmail('gmail')}
                  disabled={!meetsMinimum || !supplierEmail}
                  variant="outline"
                  className="w-full"
                  size="default"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {language === 'is' ? 'Opna í Gmail' : 'Open in Gmail Web'}
                </Button>
              </TooltipTrigger>
              {!meetsMinimum && (
                <TooltipContent>
                  <p>
                    {language === 'is' 
                      ? `Bæta við ${shortfall.toLocaleString('is-IS')} kr. til að ná lágmarki`
                      : `Add ${shortfall.toLocaleString('en-US')} kr. more to meet minimum`
                    }
                  </p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSendEmail('outlook')}
                  disabled={!meetsMinimum || !supplierEmail}
                  variant="outline"
                  className="w-full"
                  size="default"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {language === 'is' ? 'Opna í Outlook' : 'Open in Outlook Web'}
                </Button>
              </TooltipTrigger>
              {!meetsMinimum && (
                <TooltipContent>
                  <p>
                    {language === 'is' 
                      ? `Bæta við ${shortfall.toLocaleString('is-IS')} kr. til að ná lágmarki`
                      : `Add ${shortfall.toLocaleString('en-US')} kr. more to meet minimum`
                    }
                  </p>
                </TooltipContent>
              )}
            </Tooltip>

            <Button
              onClick={() => handleSendEmail('clipboard')}
              disabled={!meetsMinimum}
              variant="outline"
              className="w-full"
              size="default"
            >
              <Copy className="h-4 w-4 mr-2" />
              {language === 'is' ? 'Afrita á klemmuspjald' : 'Copy to Clipboard'}
            </Button>
          </TooltipProvider>

          {/* Secondary option */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSendEmail('mailto')}
                  disabled={!meetsMinimum || !supplierEmail}
                  variant="ghost"
                  className="w-full text-sm"
                  size="sm"
                >
                  {language === 'is' ? 'Opna í sjálfgefnu póstforriti' : 'Open in default email app'}
                </Button>
              </TooltipTrigger>
              {!meetsMinimum && (
                <TooltipContent>
                  <p>
                    {language === 'is' 
                      ? `Bæta við ${shortfall.toLocaleString('is-IS')} kr. til að ná lágmarki`
                      : `Add ${shortfall.toLocaleString('en-US')} kr. more to meet minimum`
                    }
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
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
