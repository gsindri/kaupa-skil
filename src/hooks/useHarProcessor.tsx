
import { useState } from 'react'
import { HarDataExtractor, ExtractionResult } from '@/utils/harDataExtractor'
import { HarValidator, ValidationResult } from '@/utils/harValidator'
import { HarAnalytics, AnalyticsResult } from '@/utils/harAnalytics'
import { HarRecommendationsEngine, OptimizationRecommendation, CompetitiveInsight } from '@/utils/harRecommendations'
import { useToast } from '@/hooks/use-toast'

export interface HarProcessingState {
  isProcessing: boolean
  validationResult: ValidationResult | null
  extractionResult: ExtractionResult | null
  analyticsResult: AnalyticsResult | null
  recommendations: OptimizationRecommendation[]
  insights: CompetitiveInsight[]
  actionPlan: string[]
  error: string | null
}

export function useHarProcessor() {
  const [state, setState] = useState<HarProcessingState>({
    isProcessing: false,
    validationResult: null,
    extractionResult: null,
    analyticsResult: null,
    recommendations: [],
    insights: [],
    actionPlan: [],
    error: null
  })
  const { toast } = useToast()

  const processHarFile = async (file: File): Promise<{ isValid: boolean, data?: ExtractionResult }> => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null,
      analyticsResult: null,
      recommendations: [],
      insights: [],
      actionPlan: []
    }))

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

      // Perform analytics
      const analytics = new HarAnalytics()
      const analyticsResult = analytics.analyze(extractionResult.items)

      // Generate recommendations and insights
      const recommendationsEngine = new HarRecommendationsEngine()
      const recommendations = recommendationsEngine.generateOptimizationRecommendations(
        extractionResult, 
        validationResult, 
        analyticsResult
      )
      const insights = recommendationsEngine.generateCompetitiveInsights(extractionResult, analyticsResult)
      const actionPlan = recommendationsEngine.generateActionPlan(recommendations, insights)

      setState(prev => ({ 
        ...prev, 
        extractionResult, 
        analyticsResult,
        recommendations,
        insights,
        actionPlan,
        isProcessing: false 
      }))

      // Show comprehensive summary
      toast({
        title: 'HAR Processing Complete',
        description: `Analyzed ${extractionResult.items.length} items with ${recommendations.length} optimization recommendations`
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
      analyticsResult: null,
      recommendations: [],
      insights: [],
      actionPlan: [],
      error: null
    })
  }

  return {
    ...state,
    processHarFile,
    resetState
  }
}
