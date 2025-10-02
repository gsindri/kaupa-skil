import type { DashboardWidgetDefinition } from './widget-types'
import { SuppliersWidget } from './widgets/SuppliersWidget'
import { DeliveriesWidget } from './widgets/DeliveriesWidget'
import { LowStockWidget } from './widgets/LowStockWidget'
import { SpendMtdWidget } from './widgets/SpendMtdWidget'
import { ApprovalsWidget } from './widgets/ApprovalsWidget'
import { AlertsWidget } from './widgets/AlertsWidget'
import { SupplierScorecardWidget } from './widgets/SupplierScorecardWidget'
import { PriceTrendsWidget } from './widgets/PriceTrendsWidget'
import { DeliveryHeatmapWidget } from './widgets/DeliveryHeatmapWidget'
import { SmartReorderWidget } from './widgets/SmartReorderWidget'
import { InvoiceStatusWidget } from './widgets/InvoiceStatusWidget'
import { BudgetTrackerWidget } from './widgets/BudgetTrackerWidget'
import { SeasonalInsightWidget } from './widgets/SeasonalInsightWidget'
import { NotesShortcutsWidget } from './widgets/NotesShortcutsWidget'

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetDefinition[] = [
  {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Connection health, last sync status, and quick entry points.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'operations',
    component: SuppliersWidget,
    keywords: ['operations', 'connections', 'health'],
  },
  {
    id: 'deliveries',
    name: 'Deliveries',
    description: 'Seven-day delivery plan grouped by day and supplier.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'operations',
    component: DeliveriesWidget,
    keywords: ['operations', 'logistics'],
  },
  {
    id: 'low-stock',
    name: 'Low stock',
    description: 'Items approaching par level with on-hand counts.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'inventory',
    component: LowStockWidget,
    keywords: ['inventory'],
  },
  {
    id: 'spend-mtd',
    name: 'Spend MTD',
    description: 'Month-to-date spend, variance vs last week, and budget progress.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'finance',
    component: SpendMtdWidget,
    keywords: ['finance', 'spend'],
  },
  {
    id: 'approvals',
    name: 'Approvals',
    description: 'Pending approval count and oldest waiting request.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'team',
    component: ApprovalsWidget,
    keywords: ['team'],
  },
  {
    id: 'alerts',
    name: 'Alerts',
    description: 'Priority issues across suppliers, spend, and data feeds.',
    category: 'starter',
    defaultSize: 'M',
    defaultSection: 'intelligence',
    component: AlertsWidget,
    keywords: ['intelligence'],
  },
  {
    id: 'supplier-scorecard',
    name: 'Supplier scorecard',
    description: 'Reliability, on-time delivery, and response metrics.',
    category: 'advanced',
    defaultSize: 'M',
    defaultSection: 'intelligence',
    component: SupplierScorecardWidget,
    keywords: ['suppliers', 'quality'],
  },
  {
    id: 'price-trends',
    name: 'Price trends',
    description: 'Category-level price movement over the last 30 days.',
    category: 'advanced',
    defaultSize: 'L',
    defaultSection: 'intelligence',
    component: PriceTrendsWidget,
    keywords: ['analytics'],
  },
  {
    id: 'delivery-heatmap',
    name: 'Delivery heatmap',
    description: 'Volume of supplier delivery windows by day and time block.',
    category: 'advanced',
    defaultSize: 'L',
    defaultSection: 'operations',
    component: DeliveryHeatmapWidget,
    keywords: ['operations'],
  },
  {
    id: 'smart-reorder',
    name: 'Smart reorder',
    description: 'Predicted items to replenish based on ordering cadence.',
    category: 'advanced',
    defaultSize: 'M',
    defaultSection: 'inventory',
    component: SmartReorderWidget,
    keywords: ['inventory', 'automation'],
  },
  {
    id: 'invoice-status',
    name: 'Invoice status',
    description: 'Track unpaid and overdue invoices by supplier.',
    category: 'advanced',
    defaultSize: 'M',
    defaultSection: 'finance',
    component: InvoiceStatusWidget,
    keywords: ['finance'],
  },
  {
    id: 'budget-tracker',
    name: 'Budget tracker',
    description: 'Department budgets vs actual spend.',
    category: 'advanced',
    defaultSize: 'L',
    defaultSection: 'finance',
    component: BudgetTrackerWidget,
    keywords: ['finance', 'planning'],
  },
  {
    id: 'seasonal-insight',
    name: 'Seasonal insight',
    description: 'Historical comparison to highlight seasonal demand shifts.',
    category: 'advanced',
    defaultSize: 'S',
    defaultSection: 'intelligence',
    component: SeasonalInsightWidget,
    keywords: ['analytics'],
  },
  {
    id: 'notes-shortcuts',
    name: 'Notes & shortcuts',
    description: 'Personal notes and pinned links for quick access.',
    category: 'utility',
    defaultSize: 'M',
    defaultSection: 'team',
    component: NotesShortcutsWidget,
    keywords: ['team', 'personal'],
  },
]

export function getWidgetDefinitionById(id: string) {
  return DASHBOARD_WIDGET_CATALOG.find((widget) => widget.id === id)
}
