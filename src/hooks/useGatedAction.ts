import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/useAuth'

export function useGatedAction() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingActionName, setPendingActionName] = useState<string>()

  const gateAction = useCallback(
    (action: () => void, actionName?: string) => {
      if (!user) {
        setPendingActionName(actionName)
        setShowAuthModal(true)
        return
      }
      action()
    },
    [user]
  )

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false)
    setPendingActionName(undefined)
  }, [])

  return {
    gateAction,
    showAuthModal,
    closeAuthModal,
    pendingActionName,
  }
}
