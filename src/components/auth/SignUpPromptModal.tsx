import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SignUpPromptModalProps {
  isOpen: boolean
  onClose: () => void
  productName?: string
}

export function SignUpPromptModal({ 
  isOpen, 
  onClose, 
  productName 
}: SignUpPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign up to add to cart</DialogTitle>
          <DialogDescription>
            {productName 
              ? `Create an account to add "${productName}" to your cart and place orders.`
              : 'Create an account to add items to your cart and place orders.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button asChild size="lg">
            <Link to="/signup">Create account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Already have an account? Log in</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
