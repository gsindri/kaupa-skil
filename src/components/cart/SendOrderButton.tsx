import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Mail, ChevronDown, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { useEmailComposer } from '@/hooks/useEmailComposer'
import { GmailAuthButton } from '@/components/gmail/GmailAuthButton'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()
  const {
    createEmailData,
    createMailtoLink,
    createGmailLink,
    createOutlookLink,
    copyToClipboard
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

  const handleSendEmail = async (method: 'mailto' | 'gmail' | 'outlook' | 'gmail-draft') => {
    if (!supplierEmail) {
      alert(language === 'is' ? 'Netfang ekki stillt fyrir þennan birgja' : 'Email not configured for this supplier')
      return
    }

    if (method === 'gmail-draft') {
      await handleCreateGmailDraft()
      return
    }

    let link = ''
    if (method === 'mailto') {
      link = createMailtoLink(supplierEmail, emailData, language)
      window.location.href = link
    } else if (method === 'gmail') {
      link = createGmailLink(supplierEmail, emailData, language)
      window.open(link, '_blank')
    } else if (method === 'outlook') {
      link = createOutlookLink(supplierEmail, emailData, language)
      window.open(link, '_blank')
    }
  }

  async function handleCreateGmailDraft() {
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
          ? 'Gmail drög hafa verið búin til. Athugaðu pósthólfið þitt.' 
          : 'Gmail draft has been created. Check your Gmail drafts.',
      })

      if (data?.draftUrl) {
        window.open(data.draftUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to create Gmail draft:', error)
      toast({
        title: language === 'is' ? 'Villa' : 'Error',
        description: language === 'is'
          ? 'Ekki tókst að búa til Gmail drög. Vinsamlegast tengdu Gmail fyrst.'
          : 'Failed to create Gmail draft. Please connect Gmail first.',
        variant: 'destructive',
      })
    }
  }

  const handleCopy = () => {
    copyToClipboard(emailData, language)
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'is' : 'en')
  }

  return (
    <div className="flex items-center gap-3 pt-4 border-t">
      <Avatar className="h-10 w-10">
        <AvatarImage src={supplierLogoUrl || undefined} alt={supplierName} />
        <AvatarFallback>{supplierName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="h-8 px-2"
          >
            {language === 'en' ? '🇬🇧 EN' : '🇮🇸 IS'}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <Button
                    onClick={() => handleSendEmail('mailto')}
                    disabled={!meetsMinimum || !supplierEmail}
                    className="w-full"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {language === 'is' ? 'Senda Pöntun' : 'Send Order'}
                  </Button>
                </div>
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
              {!supplierEmail && (
                <TooltipContent>
                  <p>
                    {language === 'is' 
                      ? 'Netfang ekki stillt'
                      : 'Email not configured'
                    }
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isGmailAuthorized && (
                <DropdownMenuItem onClick={() => handleSendEmail('gmail-draft')} disabled={!supplierEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  {language === 'is' ? 'Búa til Gmail drög ⭐' : 'Create Gmail Draft ⭐'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleSendEmail('gmail')} disabled={!supplierEmail}>
                <Mail className="h-4 w-4 mr-2" />
                {language === 'is' ? 'Opna í Gmail' : 'Open in Gmail Web'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail('outlook')} disabled={!supplierEmail}>
                <Mail className="h-4 w-4 mr-2" />
                {language === 'is' ? 'Opna í Outlook' : 'Open in Outlook Web'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {language === 'is' ? 'Afrita á klemmuspjald' : 'Copy to Clipboard'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <GmailAuthButton />
      </div>

      {meetsMinimum ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {language === 'is' ? 'Tilbúið' : 'Ready'}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          {minOrderValue > 0 && `${(minOrderValue - subtotal).toLocaleString()} kr.`}
        </Badge>
      )}
    </div>
  )
}
