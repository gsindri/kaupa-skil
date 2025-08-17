
import { useState } from 'react'
import { HarDataExtractor, ExtractionResult } from '@/utils/harDataExtractor'
import { HarValidator, ValidationResult } from '@/utils/harValidator'
import { useToast } from '@/hooks/use-toast'

export interface HarProcessingState {
  isProcessing: boolean
  validationResult: ValidationResult | null
  extractionResult: ExtractionResult | null
  error: string | null
}

export function useHarProcessor() {
  const [state, setState] = useState<HarProcessingState>({
    isProcessing: false,
    validationResult: null,
    extractionResult: null,
    error: null
  })
  const { toast } = useToast()

  const processHarFile = async (file: File): Promise<{ isValid: boolean, data?: ExtractionResult }> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Read file content
      const content = await file.text()
      
      // Validate HAR structure
      const validator = new HarValidator()
      const validationResult = validator.validate(content)
      
      setState(prev => ({ ...prev, validationResult }))

      if (!validationResult.isValid) {
        const errorMsg = validationResult.errors.join(', ')
        setState(prev => ({ ...prev, error: errorMsg, isProcessing: false }))
        
        toast({
          variant: 'destructive',
          title: 'Invalid HAR File',
          description: errorMsg
        })
        
        return { isValid: false }
      }

      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        toast({
          title: 'HAR File Warnings',
          description: validationResult.warnings.slice(0, 2).join(', '),
          variant: 'default'
        })
      }

      // Extract data
      const extractor = new HarDataExtractor()
      const har = JSON.parse(content)
      const extractionResult = extractor.extract(har)

      setState(prev => ({ 
        ...prev, 
        extractionResult, 
        isProcessing: false 
      }))

      // Show extraction summary
      toast({
        title: 'HAR Processing Complete',
        description: `Found ${extractionResult.items.length} items (${extractionResult.stats.confidence.high} high confidence)`
      })

      return { isValid: true, data: extractionResult }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process HAR file'
      setState(prev => ({ ...prev, error: errorMsg, isProcessing: false }))
      
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: errorMsg
      })
      
      return { isValid: false }
    }
  }

  const resetState = () => {
    setState({
      isProcessing: false,
      validationResult: null,
      extractionResult: null,
      error: null
    })
  }

  return {
    ...state,
    processHarFile,
    resetState
  }
}
