
import { ExtractionResult } from './harDataExtractor'
import { ValidationResult } from './harValidator'
import { AnalyticsResult } from './harAnalytics'

export interface OptimizationRecommendation {
  type: 'coverage' | 'quality' | 'efficiency' | 'pricing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  impact: string
}

export interface CompetitiveInsight {
  type: 'price_advantage' | 'price_gap' | 'unique_products' | 'coverage_gap'
  message: string
  confidence: number
  suggestions: string[]
}

export class HarRecommendationsEngine {
  generateOptimizationRecommendations(
    extraction: ExtractionResult,
    validation: ValidationResult,
    analytics: AnalyticsResult
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Coverage recommendations
    if (extraction.items.length < 100) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Expand Product Coverage',
        description: `Only ${extraction.items.length} products captured. More comprehensive data will improve pricing insights.`,
        action: 'Browse additional product categories and pages',
        impact: 'Better market understanding and competitive positioning'
      })
    }

    // Quality recommendations
    if (analytics.qualityMetrics.completenessScore < 0.7) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Improve Data Quality',
        description: `Data completeness is ${Math.round(analytics.qualityMetrics.completenessScore * 100)}%. Missing key product information.`,
        action: 'Navigate to detailed product pages with specifications',
        impact: 'More accurate price comparisons and better supplier negotiations'
      })
    }

    // Efficiency recommendations
    if (validation.stats.validJsonResponses < validation.stats.totalEntries * 0.3) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        title: 'Optimize Data Capture',
        description: 'Low ratio of useful API responses. Consider focusing on specific sections.',
        action: 'Browse product listing pages and search results rather than static pages',
        impact: 'Faster data collection with higher quality results'
      })
    }

    // Pricing recommendations
    if (analytics.priceAnalysis.outliers.length > extraction.items.length * 0.1) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Review Price Anomalies',
        description: `${analytics.priceAnalysis.outliers.length} products have unusual pricing patterns.`,
        action: 'Verify pricing data for flagged products and check for bulk/special pricing',
        impact: 'More accurate cost calculations and budget planning'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }).slice(0, 4)
  }

  generateCompetitiveInsights(
    currentData: ExtractionResult,
    analytics: AnalyticsResult
  ): CompetitiveInsight[] {
    const insights: CompetitiveInsight[] = []

    // Price positioning insights
    const avgPrice = analytics.priceAnalysis.averagePrice
    if (avgPrice > 0) {
      const priceDistribution = analytics.priceAnalysis.distribution
      const isValueFocused = priceDistribution.low > priceDistribution.high

      if (isValueFocused) {
        insights.push({
          type: 'price_advantage',
          message: 'Supplier appears to focus on value/budget products',
          confidence: 0.8,
          suggestions: [
            'Consider this supplier for cost-conscious purchasing',
            'Compare with premium suppliers for full market view',
            'Check for bulk pricing opportunities'
          ]
        })
      } else {
        insights.push({
          type: 'price_gap',
          message: 'Supplier appears to focus on premium products',
          confidence: 0.8,
          suggestions: [
            'Verify quality justification for premium pricing',
            'Seek alternative suppliers for budget options',
            'Negotiate volume discounts for premium items'
          ]
        })
      }
    }

    // Coverage insights
    const topCategories = analytics.categoryAnalysis.categories.slice(0, 3)
    if (topCategories.length > 0) {
      insights.push({
        type: 'coverage_gap',
        message: `Strong coverage in: ${topCategories.map(c => c.name).join(', ')}`,
        confidence: 0.9,
        suggestions: [
          'Leverage this supplier for their specialty categories',
          'Identify gaps in other product categories',
          'Consider supplier partnerships for strong categories'
        ]
      })
    }

    // Unique products insights
    const uniqueBrands = analytics.categoryAnalysis.topBrands.length
    if (uniqueBrands > 10) {
      insights.push({
        type: 'unique_products',
        message: `Wide brand selection with ${uniqueBrands} different brands`,
        confidence: 0.7,
        suggestions: [
          'Good supplier for brand variety and choice',
          'Check for exclusive brand partnerships',
          'Compare brand availability with other suppliers'
        ]
      })
    }

    return insights.slice(0, 3)
  }

  generateActionPlan(
    recommendations: OptimizationRecommendation[],
    insights: CompetitiveInsight[]
  ): string[] {
    const actions = []

    // High priority recommendations first
    const highPriority = recommendations.filter(r => r.priority === 'high')
    if (highPriority.length > 0) {
      actions.push(`🎯 Priority Actions: ${highPriority.map(r => r.action).join('; ')}`)
    }

    // Key insights
    const keyInsights = insights.slice(0, 2)
    if (keyInsights.length > 0) {
      actions.push(`💡 Key Insights: ${keyInsights.map(i => i.message).join('; ')}`)
    }

    // Next steps
    const mediumPriority = recommendations.filter(r => r.priority === 'medium')
    if (mediumPriority.length > 0) {
      actions.push(`📈 Future Improvements: ${mediumPriority.map(r => r.action).join('; ')}`)
    }

    return actions.slice(0, 3)
  }
}
