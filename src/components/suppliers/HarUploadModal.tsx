
import React, { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface HarUploadModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  supplierId: string
  onSuccess?: () => void
}

export function HarUploadModal({ 
  open, 
  onClose, 
  tenantId, 
  supplierId, 
  onSuccess 
}: HarUploadModalProps) {
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  if (!open) return null

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      const text = await file.text()
      const har = JSON.parse(text)

      const { data, error } = await supabase.functions.invoke('ingest_har', {
        body: { 
          tenant_id: tenantId, 
          supplier_id: supplierId, 
          har 
        }
      })

      if (error) throw error

      toast({
        title: 'HAR Import Successful',
        description: `Imported ${data.items} items from HAR file`
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('HAR upload error:', err)
      toast({
        variant: 'destructive',
        title: 'HAR Import Failed',
        description: err.message || 'Failed to process HAR file'
      })
    } finally {
      setBusy(false)
      event.target.value = '' // Reset file input
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Sync via HAR Upload
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Upload a HAR file from your browser's developer tools to sync supplier data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open browser DevTools (F12)</li>
                <li>Go to Network tab</li>
                <li>Enable "Preserve log"</li>
                <li>Load supplier pages (1-14)</li>
                <li>Click "Export HAR"</li>
                <li>Upload the .har file here</li>
              </ol>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="file"
              accept=".har,application/json"
              onChange={handleFileUpload}
              disabled={busy}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              We'll store the raw HAR for audit and update your catalog with normalized items/prices.
            </p>
          </div>

          {busy && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm">Processing HAR file...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
