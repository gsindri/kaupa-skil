import React, { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useBasket } from '@/contexts/useBasket'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { useGatedAction } from '@/hooks/useGatedAction'
import { SignUpPromptModal } from '@/components/auth/SignUpPromptModal'

interface CatalogShellProps {
  mode: 'public' | 'authenticated'
}

export function CatalogShell({ mode }: CatalogShellProps) {
  const isPublicMode = mode === 'public'
  const { user } = useAuth()
  const { addItem } = useBasket()
  const { gateAction, showAuthModal, closeAuthModal, pendingActionName } = useGatedAction()
  
  const [addingId, setAddingId] = useState<string | null>(null)
  
  // Fetch catalog items with no filters for public preview
  const { data: products, loadMore } = useCatalogProducts(
    {}, 
    'az'
  )
  const hasMore = false // Simplified - catalog loads all products initially
  
  const handleAddToCart = useCallback((product: any, supplierId?: string) => {
    if (isPublicMode) {
      gateAction(() => {}, product.name)
      return
    }
    
    // Normal cart flow for authenticated users
    const firstSupplierId = supplierId || product.supplier_ids?.[0]
    if (!firstSupplierId) return
    
    setAddingId(product.catalog_id)
    addItem({
      product_id: product.catalog_id,
      supplier_id: firstSupplierId,
      quantity: 1,
    })
    setTimeout(() => setAddingId(null), 800)
  }, [isPublicMode, gateAction, user, addItem])
  
  return (
    <>
      <CatalogGrid
        products={products}
        onAddToCart={handleAddToCart}
        onNearEnd={hasMore ? loadMore : undefined}
        showPrice={!isPublicMode}
        addingId={addingId}
        mode={mode}
      />
      
      {showAuthModal && (
        <SignUpPromptModal
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          productName={pendingActionName}
        />
      )}
    </>
  )
}
