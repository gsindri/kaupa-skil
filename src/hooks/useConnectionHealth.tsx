
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface ConnectionHealth {
  isOnline: boolean
  supabaseConnected: boolean
  lastCheck: Date | null
  latency: number | null
}

export function useConnectionHealth() {
  const [health, setHealth] = useState<ConnectionHealth>({
    isOnline: navigator.onLine,
    supabaseConnected: false,
    lastCheck: null,
    latency: null
  })

  const checkSupabaseConnection = useCallback(async () => {
    const startTime = performance.now()
    
    try {
      // Simple query to test connection
      const { error } = await supabase.from('profiles').select('id').limit(1)
      const endTime = performance.now()
      const latency = endTime - startTime

      setHealth(prev => ({
        ...prev,
        supabaseConnected: !error,
        lastCheck: new Date(),
        latency: Math.round(latency)
      }))

      return !error
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        supabaseConnected: false,
        lastCheck: new Date(),
        latency: null
      }))
      return false
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkSupabaseConnection()

    // Check connection every 30 seconds
    const interval = setInterval(checkSupabaseConnection, 30000)

    // Listen for online/offline events
    const handleOnline = () => {
      setHealth(prev => ({ ...prev, isOnline: true }))
      checkSupabaseConnection()
    }
    
    const handleOffline = () => {
      setHealth(prev => ({ ...prev, isOnline: false, supabaseConnected: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkSupabaseConnection])

  return {
    ...health,
    refresh: checkSupabaseConnection
  }
}
