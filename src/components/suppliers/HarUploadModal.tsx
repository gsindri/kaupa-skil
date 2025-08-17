
import React, { useState } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useHarProcessor } from '@/hooks/useHarProcessor'
import { HarProcessingPreview } from './HarProcessingPreview'

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
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'uploading'>('select')
  const { toast } = useToast()
  const harProcessor = useHarProcessor()

  if (!open) return null

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    setUploadStep('preview')

    try {
      const result = await harProcessor.processHarFile(file)
      
      if (!result.isValid) {
        setUploadStep('select')
        return
      }

      setBusy(false)
    } catch (error) {
      console.error('File processing error:', error)
      setUploadStep('select')
      setBusy(false)
    }
  }

  const handleConfirmUpload = async () => {
    if (!harProcessor.extractionResult) return

    setBusy(true)
    setUploadStep('uploading')

    try {
      // Prepare the HAR data for the edge function
      const harData = {
        log: {
          entries: [] // We'll reconstruct this from the extraction results
        }
      }

      // Transform extraction results back to HAR-like format for processing
      const mockEntries = harProcessor.extractionResult.items.map(item => ({
        request: { url: item.source },
        response: {
          content: {
            mimeType: 'application/json',
            text: JSON.stringify({
              items: [{
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                pack: item.pack,
                price_ex_vat: item.price,
                vat_code: item.vatCode
              }]
            })
          }
        }
      }))

      harData.log.entries = mockEntries

      const { data, error } = await supabase.functions.invoke('ingest_har', {
        body: { 
          tenant_id: tenantId, 
          supplier_id: supplierId, 
          har: harData 
        }
      })

      if (error) throw error

      toast({
        title: 'HAR Import Successful',
        description: `Imported ${data.items} items with enhanced processing`
      })

      onSuccess?.()
      handleClose()

    } catch (err: any) {
      console.error('HAR upload error:', err)
      toast({
        variant: 'destructive',
        title: 'HAR Import Failed',
        description: err.message || 'Failed to process HAR file'
      })
      setUploadStep('preview')
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    harProcessor.resetState()
    setUploadStep('select')
    setBusy(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enhanced HAR Upload & Processing
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Upload a HAR file with advanced validation and data extraction
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {uploadStep === 'select' && (
            <>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open browser DevTools (F12)</li>
                    <li>Go to Network tab</li>
                    <li>Enable "Preserve log"</li>
                    <li>Load supplier pages with products</li>
                    <li>Right-click → "Save all as HAR"</li>
                    <li>Upload the .har file here</li>
                  </ol>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".har,application/json"
                  onChange={handleFileSelect}
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
                  Enhanced processing with validation, deduplication, and quality scoring
                </p>
              </div>
            </>
          )}

          {uploadStep === 'preview' && (
            <div className="space-y-4">
              <HarProcessingPreview 
                validationResult={harProcessor.validationResult}
                extractionResult={harProcessor.extractionResult}
              />
              
              {harProcessor.extractionResult && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={busy}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import {harProcessor.extractionResult.items.length} Items
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadStep('select')}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {(busy || uploadStep === 'uploading') && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm">
                {uploadStep === 'preview' ? 'Processing HAR file...' : 'Importing data...'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
