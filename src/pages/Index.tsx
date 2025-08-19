import React from 'react'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { VirtualizedSupplierItemsList } from '@/components/quick/VirtualizedSupplierItemsList'
import { SmartCartSidebar } from '@/components/quick/SmartCartSidebar'
import { SmartSuggestions } from '@/components/quick/SmartSuggestions'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { QuickOrderNavigation } from '@/components/quick/QuickOrderNavigation'
import { AccessibilityEnhancements } from '@/components/quick/AccessibilityEnhancements'
import { KeyboardShortcuts } from '@/components/quick/KeyboardShortcuts'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTracker'
import { CacheManager } from '@/components/quick/CacheManager'
import { BulkActions } from '@/components/quick/BulkActions'
import { MiniCompareDrawer } from '@/components/quick/MiniCompareDrawer'
import { AdvancedFiltering } from '@/components/quick/AdvancedFiltering'
import { ItemHoverEffects } from '@/components/quick/ItemHoverEffects'
import { CompactOrderGuidesCTA } from '@/components/quick/CompactOrderGuidesCTA'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { QuickOrderErrorFallback } from '@/components/quick/QuickOrderErrorFallback'

function QuickOrder() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-screen">
      {/* Main Content Area */}
      <main className="lg:col-span-3 flex flex-col">
        <ErrorBoundary fallback={<QuickOrderErrorFallback />}>
          <QuickOrderNavigation />
          <QuickSearch />
          <SmartSuggestions />
          <BulkActions />
          <AdvancedFiltering />
          <VirtualizedSupplierItemsList />
          <ItemHoverEffects />
        </ErrorBoundary>
      </main>

      {/* Sidebar */}
      <aside className="lg:col-span-1">
        <ErrorBoundary fallback={<QuickOrderErrorFallback />}>
          <SmartCartSidebar />
          <DeliveryOptimizationBanner />
          <CompactOrderGuidesCTA />
          <MiniCompareDrawer />
        </ErrorBoundary>
      </aside>

      {/* Accessibility and Utilities */}
      <AccessibilityEnhancements />
      <KeyboardShortcuts />
      <AnalyticsTracker />
      <CacheManager />
    </div>
  )
}

export default QuickOrder
