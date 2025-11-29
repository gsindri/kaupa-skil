import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { CartItem } from '@/lib/types'

export interface CartConflict {
  type: 'quantity_change' | 'item_removed' | 'item_added'
  supplierItemId: string
  itemName: string
  localVersion: CartItem | null
  remoteVersion: CartItem | null
  timestamp: number
}

interface ConflictResolutionModalProps {
  conflicts: CartConflict[]
  onResolve: (resolution: 'keep_local' | 'keep_remote' | 'merge') => void
  onDismiss: () => void
}

export function ConflictResolutionModal({
  conflicts,
  onResolve,
  onDismiss
}: ConflictResolutionModalProps) {
  if (conflicts.length === 0) return null

  const conflict = conflicts[0] // Show one conflict at a time

  const getConflictDescription = () => {
    switch (conflict.type) {
      case 'quantity_change':
        return (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              The quantity for <strong>{conflict.itemName}</strong> was changed on another device while you were updating it here.
            </p>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Your Device</p>
                <p className="text-2xl font-bold text-primary">
                  {conflict.localVersion?.quantity || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {conflict.localVersion?.packPrice 
                    ? `${(conflict.localVersion.packPrice * (conflict.localVersion.quantity || 0)).toFixed(0)} ISK`
                    : 'Price unavailable'}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-accent/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Other Device</p>
                <p className="text-2xl font-bold text-accent-foreground">
                  {conflict.remoteVersion?.quantity || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {conflict.remoteVersion?.packPrice 
                    ? `${(conflict.remoteVersion.packPrice * (conflict.remoteVersion.quantity || 0)).toFixed(0)} ISK`
                    : 'Price unavailable'}
                </p>
              </div>
            </div>
          </>
        )
      
      case 'item_removed':
        return (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{conflict.itemName}</strong> was removed from the cart on another device, but you just modified it here.
            </p>
            <div className="border rounded-lg p-4 bg-muted/50 my-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">Your Local Changes</p>
              <p className="text-lg font-medium">
                Quantity: {conflict.localVersion?.quantity || 0}
              </p>
            </div>
          </>
        )
      
      case 'item_added':
        return (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{conflict.itemName}</strong> was added to your cart on another device while you were working here.
            </p>
            <div className="border rounded-lg p-4 bg-accent/50 my-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">Added on Other Device</p>
              <p className="text-lg font-medium">
                Quantity: {conflict.remoteVersion?.quantity || 0}
              </p>
            </div>
          </>
        )
    }
  }

  const getActionButtons = () => {
    switch (conflict.type) {
      case 'quantity_change':
        return (
          <>
            <Button 
              variant="outline" 
              onClick={() => onResolve('keep_remote')}
            >
              Use Other Device's Version
            </Button>
            <Button 
              onClick={() => onResolve('keep_local')}
            >
              Keep My Version
            </Button>
          </>
        )
      
      case 'item_removed':
        return (
          <>
            <Button 
              variant="outline" 
              onClick={() => onResolve('keep_remote')}
            >
              Keep Item Removed
            </Button>
            <Button 
              onClick={() => onResolve('keep_local')}
            >
              Restore Item
            </Button>
          </>
        )
      
      case 'item_added':
        return (
          <>
            <Button 
              variant="outline" 
              onClick={onDismiss}
            >
              Dismiss
            </Button>
            <Button 
              onClick={() => onResolve('keep_remote')}
            >
              Accept Addition
            </Button>
          </>
        )
    }
  }

  return (
    <Dialog open={true} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <DialogTitle>Cart Sync Conflict</DialogTitle>
          </div>
          <DialogDescription>
            Changes were made to your cart from multiple devices at the same time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {getConflictDescription()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {getActionButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
