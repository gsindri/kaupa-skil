import React, { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useBasket } from '@/contexts/useBasket'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { SignUpPromptModal } from '@/components/auth/SignUpPromptModal'

export function CatalogGridWrapper() {
  const [addingId, setAddingId] = useState<string | null>(null)
  const [promptModal, setPromptModal] = useState<{ 
    open: boolean
    productName: string 
  } | null>(null)
  
  const { user } = useAuth()
  const { addItem } = useBasket()
  
  // Fetch catalog items with no filters for public preview
  const { data: products, loadMore, hasNextPage } = useCatalogProducts(
    {}, 
    'az'
  )
  
  const handleAddToCart = useCallback((product: any, supplierId?: string) => {
    if (!user) {
      // Show sign-up prompt for anonymous users
      setPromptModal({ 
        open: true, 
        productName: product.name 
      })
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
  }, [user, addItem])
  
  return (
    <>
      <CatalogGrid
        products={products}
        onAddToCart={handleAddToCart}
        onNearEnd={hasNextPage ? loadMore : undefined}
        showPrice={true}
        addingId={addingId}
      />
      
      {promptModal && (
        <SignUpPromptModal
          isOpen={promptModal.open}
          onClose={() => setPromptModal(null)}
          productName={promptModal.productName}
        />
      )}
    </>
  )
}
