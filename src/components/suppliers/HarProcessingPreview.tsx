
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { ValidationResult } from '@/utils/harValidator'
import { ExtractionResult } from '@/utils/harDataExtractor'

interface HarProcessingPreviewProps {
  validationResult: ValidationResult | null
  extractionResult: ExtractionResult | null
}

export function HarProcessingPreview({ 
  validationResult, 
  extractionResult 
}: HarProcessingPreviewProps) {
  if (!validationResult && !extractionResult) return null

  return (
    <div className="space-y-4">
      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              HAR File Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Entries:</span>
                <span className="ml-2 font-medium">{validationResult.stats.totalEntries}</span>
              </div>
              <div>
                <span className="text-muted-foreground">JSON Responses:</span>
                <span className="ml-2 font-medium">{validationResult.stats.validJsonResponses}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Product APIs:</span>
                <span className="ml-2 font-medium">{validationResult.stats.potentialProductApis}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Items:</span>
                <span className="ml-2 font-medium">{validationResult.stats.estimatedItems}</span>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Errors
                </div>
                {validationResult.errors.map((error, idx) => (
                  <div key={idx} className="text-sm text-red-600 pl-5">
                    • {error}
                  </div>
                ))}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                  <Info className="h-3 w-3" />
                  Warnings
                </div>
                {validationResult.warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm text-yellow-600 pl-5">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extraction Results */}
      {extractionResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Data Extraction Results
            </CardTitle>
            <CardDescription>
              {extractionResult.items.length} items extracted and validated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confidence Distribution */}
            <div>
              <div className="text-sm font-medium mb-2">Data Quality</div>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  High: {extractionResult.stats.confidence.high}
                </Badge>
                <Badge variant="secondary">
                  Medium: {extractionResult.stats.confidence.medium}
                </Badge>
                <Badge variant="outline">
                  Low: {extractionResult.stats.confidence.low}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Processing Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">JSON Responses:</span>
                <span className="ml-2 font-medium">{extractionResult.stats.jsonResponses}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Product Arrays:</span>
                <span className="ml-2 font-medium">{extractionResult.stats.productArrays}</span>
              </div>
            </div>

            {/* Sample Items Preview */}
            {extractionResult.items.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Sample Items (Top 3)</div>
                <div className="space-y-2">
                  {extractionResult.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded text-xs space-y-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="flex gap-4 text-muted-foreground">
                        <span>SKU: {item.sku}</span>
                        <span>Price: ${item.price.toFixed(2)}</span>
                        {item.brand && <span>Brand: {item.brand}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={item.confidence >= 0.8 ? "default" : item.confidence >= 0.5 ? "secondary" : "outline"}
                          className="text-xs px-1 py-0"
                        >
                          {Math.round(item.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {extractionResult.items.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      ... and {extractionResult.items.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
