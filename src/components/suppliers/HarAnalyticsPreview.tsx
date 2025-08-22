
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, AlertTriangle, Target, Lightbulb, BarChart3, PieChart } from 'lucide-react'
import { AnalyticsResult } from '@/utils/harAnalytics'
import { OptimizationRecommendation, CompetitiveInsight } from '@/utils/harRecommendations'

interface HarAnalyticsPreviewProps {
  analytics?: AnalyticsResult | null
  recommendations: OptimizationRecommendation[]
  insights: CompetitiveInsight[]
  actionPlan: string[]
}

export function HarAnalyticsPreview({
  analytics,
  recommendations,
  insights,
  actionPlan
}: HarAnalyticsPreviewProps) {
  if (!analytics) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Quality Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Data Quality Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Completeness Score</div>
              <Progress value={analytics.qualityMetrics.completenessScore * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(analytics.qualityMetrics.completenessScore * 100)}% of fields populated
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Data Quality Score</div>
              <Progress value={analytics.qualityMetrics.dataQualityScore * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(analytics.qualityMetrics.dataQualityScore * 100)}% quality rating
              </div>
            </div>
          </div>

          {analytics.qualityMetrics.missingFields.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Missing Fields</div>
              <div className="flex gap-1 flex-wrap">
                {analytics.qualityMetrics.missingFields.map(field => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Price Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Average:</span>
              <span className="ml-2 font-medium">€{analytics.priceAnalysis.averagePrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Range:</span>
              <span className="ml-2 font-medium">
                €{analytics.priceAnalysis.priceRange.min.toFixed(2)} - €{analytics.priceAnalysis.priceRange.max.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Outliers:</span>
              <span className="ml-2 font-medium">{analytics.priceAnalysis.outliers.length}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Price Distribution</div>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-500">
                Low: {analytics.priceAnalysis.distribution.low}
              </Badge>
              <Badge variant="secondary">
                Medium: {analytics.priceAnalysis.distribution.medium}
              </Badge>
              <Badge variant="outline">
                High: {analytics.priceAnalysis.distribution.high}
              </Badge>
            </div>
          </div>

          {analytics.priceAnalysis.outliers.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Top Price Outliers</div>
              <div className="space-y-1">
                {analytics.priceAnalysis.outliers.slice(0, 3).map((outlier, idx) => (
                  <div key={idx} className="text-xs bg-muted/50 rounded p-2">
                    <div className="font-medium">{outlier.name}</div>
                    <div className="text-muted-foreground">
                      €{outlier.price.toFixed(2)} ({outlier.deviation.toFixed(1)}σ deviation)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Analysis */}
      {analytics.categoryAnalysis.categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-purple-500" />
              Category & Brand Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Top Categories</div>
              <div className="space-y-2">
                {analytics.categoryAnalysis.categories.slice(0, 4).map((category, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span>{category.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {category.count} items
                      </Badge>
                      <span className="text-muted-foreground">
                        avg €{category.avgPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analytics.categoryAnalysis.topBrands.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Top Brands</div>
                <div className="flex gap-1 flex-wrap">
                  {analytics.categoryAnalysis.topBrands.slice(0, 6).map((brand, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {brand.brand} ({brand.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-orange-500" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{rec.title}</div>
                  <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{rec.description}</div>
                <div className="text-xs">
                  <span className="font-medium">Action:</span> {rec.action}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Impact:</span> {rec.impact}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competitive Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Competitive Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{insight.message}</div>
                  <Badge variant="outline" className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="space-y-1">
                  {insight.suggestions.map((suggestion, sidx) => (
                    <div key={sidx} className="text-xs text-muted-foreground">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {actionPlan.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              Recommended Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionPlan.map((action, idx) => (
                <div key={idx} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                  {action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Summary */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {analytics.insights.map((insight, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  • {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
