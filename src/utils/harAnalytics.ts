
export interface PriceAnalysis {
  averagePrice: number
  priceRange: { min: number; max: number }
  outliers: Array<{ sku: string; name: string; price: number; deviation: number }>
  distribution: { low: number; medium: number; high: number }
}

export interface CategoryAnalysis {
  categories: Array<{ name: string; count: number; avgPrice: number }>
  topBrands: Array<{ brand: string; count: number; avgPrice: number }>
  packSizeDistribution: Array<{ type: string; count: number }>
}

export interface QualityMetrics {
  completenessScore: number
  dataQualityScore: number
  missingFields: string[]
  inconsistencies: Array<{ type: string; count: number; examples: string[] }>
}

export interface AnalyticsResult {
  priceAnalysis: PriceAnalysis
  categoryAnalysis: CategoryAnalysis
  qualityMetrics: QualityMetrics
  recommendations: string[]
  insights: string[]
}

export class HarAnalytics {
  analyze(items: any[]): AnalyticsResult {
    const priceAnalysis = this.analyzePrices(items)
    const categoryAnalysis = this.analyzeCategories(items)
    const qualityMetrics = this.analyzeQuality(items)
    
    return {
      priceAnalysis,
      categoryAnalysis,
      qualityMetrics,
      recommendations: this.generateRecommendations(items, priceAnalysis, qualityMetrics),
      insights: this.generateInsights(items, priceAnalysis, categoryAnalysis)
    }
  }

  private analyzePrices(items: any[]): PriceAnalysis {
    const prices = items.map(item => item.price).filter(p => p > 0)
    
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        outliers: [],
        distribution: { low: 0, medium: 0, high: 0 }
      }
    }

    const sorted = [...prices].sort((a, b) => a - b)
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length)

    // Find outliers (more than 2 standard deviations from mean)
    const outliers = items
      .filter(item => Math.abs(item.price - average) > 2 * stdDev)
      .map(item => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        deviation: Math.abs(item.price - average) / stdDev
      }))
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 5)

    // Price distribution
    const q1 = sorted[Math.floor(sorted.length * 0.33)]
    const q3 = sorted[Math.floor(sorted.length * 0.67)]
    
    const distribution = {
      low: prices.filter(p => p <= q1).length,
      medium: prices.filter(p => p > q1 && p <= q3).length,
      high: prices.filter(p => p > q3).length
    }

    return {
      averagePrice: average,
      priceRange: { min: sorted[0], max: sorted[sorted.length - 1] },
      outliers,
      distribution
    }
  }

  private analyzeCategories(items: any[]): CategoryAnalysis {
    // Infer categories from product names using keywords
    const categoryKeywords = {
      'Beverages': ['drink', 'juice', 'water', 'soda', 'beer', 'wine', 'coffee', 'tea'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'Meat': ['beef', 'chicken', 'pork', 'fish', 'salmon', 'meat'],
      'Produce': ['apple', 'banana', 'potato', 'onion', 'carrot', 'tomato'],
      'Bakery': ['bread', 'cake', 'cookies', 'pastry', 'muffin'],
      'Frozen': ['frozen', 'ice cream', 'pizza']
    }

    const itemsWithCategories = items.map(item => {
      const name = item.name.toLowerCase()
      const category = Object.entries(categoryKeywords).find(([_, keywords]) =>
        keywords.some(keyword => name.includes(keyword))
      )?.[0] || 'Other'
      
      return { ...item, category }
    })

    // Category analysis
    const categoryStats = Object.values(
      itemsWithCategories.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { name: item.category, count: 0, totalPrice: 0 }
        }
        acc[item.category].count++
        acc[item.category].totalPrice += item.price
        return acc
      }, {} as Record<string, any>)
    ).map(cat => ({
      ...cat,
      avgPrice: cat.totalPrice / cat.count
    })).sort((a, b) => b.count - a.count)

    // Brand analysis
    const brandStats = Object.values(
      items.filter(item => item.brand).reduce((acc, item) => {
        if (!acc[item.brand]) {
          acc[item.brand] = { brand: item.brand, count: 0, totalPrice: 0 }
        }
        acc[item.brand].count++
        acc[item.brand].totalPrice += item.price
        return acc
      }, {} as Record<string, any>)
    ).map(brand => ({
      ...brand,
      avgPrice: brand.totalPrice / brand.count
    })).sort((a, b) => b.count - a.count).slice(0, 10)

    // Pack size analysis
    const packTypes = items.reduce((acc, item) => {
      const pack = item.pack.toLowerCase()
      let type = 'Unit'
      if (pack.includes('kg') || pack.includes('g')) type = 'Weight'
      else if (pack.includes('l') || pack.includes('ml')) type = 'Volume'
      else if (pack.includes('x') || pack.includes('pack')) type = 'Multi-pack'
      
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      categories: categoryStats,
      topBrands: brandStats,
      packSizeDistribution: Object.entries(packTypes).map(([type, count]) => ({ type, count }))
    }
  }

  private analyzeQuality(items: any[]): QualityMetrics {
    const totalItems = items.length
    if (totalItems === 0) {
      return {
        completenessScore: 0,
        dataQualityScore: 0,
        missingFields: [],
        inconsistencies: []
      }
    }

    // Check field completeness
    const fieldChecks = {
      sku: items.filter(i => i.sku && i.sku.length > 0).length,
      name: items.filter(i => i.name && i.name.length > 0).length,
      brand: items.filter(i => i.brand && i.brand.length > 0).length,
      pack: items.filter(i => i.pack && i.pack.length > 0).length,
      price: items.filter(i => i.price && i.price > 0).length
    }

    const completenessScore = Object.values(fieldChecks).reduce((sum, count) => sum + count, 0) / (totalItems * 5)

    // Identify missing fields
    const missingFields = Object.entries(fieldChecks)
      .filter(([_, count]) => count < totalItems * 0.8)
      .map(([field, _]) => field)

    // Check for inconsistencies
    const inconsistencies = []
    
    // Price inconsistencies
    const zeroPrices = items.filter(i => !i.price || i.price <= 0).length
    if (zeroPrices > 0) {
      inconsistencies.push({
        type: 'Missing/Zero Prices',
        count: zeroPrices,
        examples: items.filter(i => !i.price || i.price <= 0).slice(0, 3).map(i => i.name)
      })
    }

    // Name inconsistencies (very short names)
    const shortNames = items.filter(i => i.name && i.name.length < 3).length
    if (shortNames > 0) {
      inconsistencies.push({
        type: 'Very Short Names',
        count: shortNames,
        examples: items.filter(i => i.name && i.name.length < 3).slice(0, 3).map(i => i.name)
      })
    }

    const dataQualityScore = Math.max(0, 1 - (inconsistencies.length * 0.1))

    return {
      completenessScore,
      dataQualityScore,
      missingFields,
      inconsistencies
    }
  }

  private generateRecommendations(items: any[], priceAnalysis: PriceAnalysis, qualityMetrics: QualityMetrics): string[] {
    const recommendations = []

    if (qualityMetrics.completenessScore < 0.8) {
      recommendations.push('Consider capturing more product pages to improve data completeness')
    }

    if (qualityMetrics.missingFields.includes('brand')) {
      recommendations.push('Try browsing brand-specific pages to capture more brand information')
    }

    if (priceAnalysis.outliers.length > 0) {
      recommendations.push(`Review ${priceAnalysis.outliers.length} price outliers for potential data quality issues`)
    }

    if (items.length < 50) {
      recommendations.push('Browse more product pages to capture a larger sample size')
    }

    if (qualityMetrics.inconsistencies.length > 0) {
      recommendations.push('Some data quality issues detected - consider browsing different sections of the supplier site')
    }

    return recommendations.slice(0, 5)
  }

  private generateInsights(items: any[], priceAnalysis: PriceAnalysis, categoryAnalysis: CategoryAnalysis): string[] {
    const insights = []

    if (categoryAnalysis.categories.length > 0) {
      const topCategory = categoryAnalysis.categories[0]
      insights.push(`Most common category: ${topCategory.name} (${topCategory.count} items, avg €${topCategory.avgPrice.toFixed(2)})`)
    }

    if (categoryAnalysis.topBrands.length > 0) {
      const topBrand = categoryAnalysis.topBrands[0]
      insights.push(`Top brand: ${topBrand.brand} (${topBrand.count} items, avg €${topBrand.avgPrice.toFixed(2)})`)
    }

    if (priceAnalysis.distribution.high > priceAnalysis.distribution.low) {
      insights.push('Premium product focus detected - mostly higher-priced items')
    } else if (priceAnalysis.distribution.low > priceAnalysis.distribution.high) {
      insights.push('Value product focus detected - mostly lower-priced items')
    }

    const avgPrice = priceAnalysis.averagePrice
    if (avgPrice > 0) {
      insights.push(`Average price: €${avgPrice.toFixed(2)} (range: €${priceAnalysis.priceRange.min.toFixed(2)} - €${priceAnalysis.priceRange.max.toFixed(2)})`)
    }

    return insights.slice(0, 4)
  }
}
