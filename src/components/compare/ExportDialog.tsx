
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, Table, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportDialogProps {
  data: any[]
  trigger: React.ReactNode
}

export function ExportDialog({ data, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [includeFields, setIncludeFields] = useState({
    itemName: true,
    brand: true,
    category: true,
    suppliers: true,
    pricing: true,
    availability: true,
    priceHistory: false
  })
  const { toast } = useToast()

  const fields = [
    { key: 'itemName', label: 'Item Name', icon: FileText },
    { key: 'brand', label: 'Brand', icon: FileText },
    { key: 'category', label: 'Category', icon: FileText },
    { key: 'suppliers', label: 'Supplier Information', icon: FileText },
    { key: 'pricing', label: 'Pricing Data', icon: FileText },
    { key: 'availability', label: 'Stock Status', icon: FileText },
    { key: 'priceHistory', label: 'Price History', icon: Table }
  ]

  const handleExport = () => {
    // Simulate export process
    toast({
      title: 'Export started',
      description: `Preparing ${format.toUpperCase()} export with ${Object.values(includeFields).filter(Boolean).length} fields...`
    })

    // Simulate processing delay
    setTimeout(() => {
      toast({
        title: 'Export ready',
        description: `Your ${format.toUpperCase()} file has been generated and downloaded.`
      })
      setOpen(false)
    }, 2000)
  }

  const handleEmailExport = () => {
    toast({
      title: 'Export emailed',
      description: 'The export has been sent to your registered email address.'
    })
    setOpen(false)
  }

  const toggleField = (field: keyof typeof includeFields) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const selectedCount = Object.values(includeFields).filter(Boolean).length
  const estimatedSize = Math.round(data.length * selectedCount * 0.5) // Rough estimate in KB

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Price Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: typeof format) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <Label>Include Fields</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fields.map(field => {
                const Icon = field.icon
                return (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={includeFields[field.key as keyof typeof includeFields]}
                      onCheckedChange={() => toggleField(field.key as keyof typeof includeFields)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="text-sm font-medium">Export Summary</div>
            <div className="text-xs text-muted-foreground">
              {data.length} items • {selectedCount} fields • ~{estimatedSize}KB
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleExport} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEmailExport} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
