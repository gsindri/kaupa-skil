import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface EmailAuthStatus {
    isGmailAuthorized: boolean
    isOutlookAuthorized: boolean
    userEmail: string | null
    isLoading: boolean
    refresh: () => Promise<void>
}

export function useEmailAuth(): EmailAuthStatus {
    const [isGmailAuthorized, setIsGmailAuthorized] = useState(false)
    const [isOutlookAuthorized, setIsOutlookAuthorized] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const checkAuth = async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsGmailAuthorized(false)
                setIsOutlookAuthorized(false)
                setUserEmail(null)
                return
            }

            setUserEmail(user.email || null)

            const { data: profile } = await supabase
                .from('profiles')
                .select('gmail_authorized, outlook_authorized')
                .eq('id', user.id)
                .single()

            setIsGmailAuthorized(profile?.gmail_authorized || false)
            setIsOutlookAuthorized(profile?.outlook_authorized || false)
        } catch (error) {
            console.error('Error checking email auth:', error)
            setIsGmailAuthorized(false)
            setIsOutlookAuthorized(false)
            setUserEmail(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()

        // Listen for auth changes
        const channel = supabase.channel('email-auth-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${supabase.auth.getUser().then(r => r.data.user?.id)}`
                },
                () => {
                    checkAuth()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return {
        isGmailAuthorized,
        isOutlookAuthorized,
        userEmail,
        isLoading,
        refresh: checkAuth
    }
}
