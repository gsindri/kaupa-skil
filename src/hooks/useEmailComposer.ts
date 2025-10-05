import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'
import { generateOrderSubject, generateOrderEmailBody, type OrderEmailData, type EmailLanguage } from '@/lib/emailTemplates'
import type { CartItem } from '@/lib/types'

interface UserProfile {
  full_name: string | null
  email: string | null
}

interface TenantInfo {
  name: string
}

export function useEmailComposer() {
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        const { data: memberships } = await supabase
          .from('memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (memberships?.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', memberships.tenant_id)
            .single()

          setTenantInfo(tenant)
        }

        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  function generatePONumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PO-${timestamp}-${random}`
  }

  function createEmailData(
    supplierName: string,
    items: CartItem[],
    subtotal: number,
    options: {
      includeVat?: boolean
      deliveryDate?: string
      notes?: string
    } = {}
  ): OrderEmailData {
    const { includeVat = false, deliveryDate, notes } = options

    return {
      poNumber: generatePONumber(),
      supplierName,
      organizationName: tenantInfo?.name || 'Your Company',
      deliveryDate,
      items: items.map(item => ({
        name: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        packSize: item.packSize,
        unitPrice: includeVat ? item.unitPriceIncVat ?? null : item.unitPriceExVat ?? null
      })),
      subtotal,
      notes,
      pricesIncludeVat: includeVat,
      contactName: userProfile?.full_name || undefined,
      contactEmail: userProfile?.email || undefined,
      deliveryAddress: undefined
    }
  }

  function createMailtoLink(
    supplierEmail: string,
    emailData: OrderEmailData,
    language: EmailLanguage
  ): string {
    const subject = generateOrderSubject(emailData.poNumber, emailData.organizationName, language)
    const body = generateOrderEmailBody(emailData, language)
    
    return `mailto:${supplierEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function createGmailLink(
    supplierEmail: string,
    emailData: OrderEmailData,
    language: EmailLanguage
  ): string {
    const subject = generateOrderSubject(emailData.poNumber, emailData.organizationName, language)
    const body = generateOrderEmailBody(emailData, language)
    
    return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(supplierEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function createOutlookLink(
    supplierEmail: string,
    emailData: OrderEmailData,
    language: EmailLanguage
  ): string {
    const subject = generateOrderSubject(emailData.poNumber, emailData.organizationName, language)
    const body = generateOrderEmailBody(emailData, language)
    
    return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(supplierEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  async function copyToClipboard(
    emailData: OrderEmailData,
    language: EmailLanguage
  ): Promise<void> {
    const subject = generateOrderSubject(emailData.poNumber, emailData.organizationName, language)
    const body = generateOrderEmailBody(emailData, language)
    const fullText = `${subject}\n\n${body}`
    
    try {
      await navigator.clipboard.writeText(fullText)
      toast({
        title: language === 'is' ? 'Afritað' : 'Copied',
        description: language === 'is' ? 'Pöntun afrituð á klemmuspjald' : 'Order copied to clipboard'
      })
    } catch (error) {
      toast({
        title: language === 'is' ? 'Villa' : 'Error',
        description: language === 'is' ? 'Ekki tókst að afrita' : 'Failed to copy',
        variant: 'destructive'
      })
    }
  }

  return {
    isLoading,
    userProfile,
    tenantInfo,
    generatePONumber,
    createEmailData,
    createMailtoLink,
    createGmailLink,
    createOutlookLink,
    copyToClipboard
  }
}
