
import React from 'react'
import { SupplierManagementRefactored } from '@/components/suppliers/SupplierManagementRefactored'

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
        <p className="text-muted-foreground">
          Manage supplier credentials and ingestion processes
        </p>
      </div>
      
      <SupplierManagementRefactored />
    </div>
  )
}
