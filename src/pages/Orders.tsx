
import React from 'react'
import { OrderComposer } from '@/components/orders/OrderComposer'

export default function Orders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground">
          Compose and dispatch orders to suppliers
        </p>
      </div>
      
      <OrderComposer />
    </div>
  )
}
