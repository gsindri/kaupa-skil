
import React from 'react'
import { EnhancedSupplierManagement } from '@/components/suppliers/EnhancedSupplierManagement'

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
        <p className="text-muted-foreground">
          Manage supplier credentials, HAR data ingestion, and product synchronization
        </p>
      </div>
      
      <EnhancedSupplierManagement />
    </div>
  )
}
