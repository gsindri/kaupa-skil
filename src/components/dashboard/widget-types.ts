import type React from 'react'

export type DashboardWidgetSize = 'S' | 'M' | 'L'
export type DashboardSectionId = 'operations' | 'inventory' | 'finance' | 'team' | 'intelligence'

export interface DashboardWidgetDescriptor {
  id: string
  type: string
  size: DashboardWidgetSize
  section: DashboardSectionId
  order: number
  settings?: Record<string, unknown>
}

export interface DashboardWidgetComponentProps {
  size: DashboardWidgetSize
  definition: DashboardWidgetDefinition
  isInEditMode: boolean
}

export type DashboardWidgetCategory = 'starter' | 'advanced' | 'utility'

export interface DashboardWidgetDefinition {
  id: string
  name: string
  description: string
  category: DashboardWidgetCategory
  defaultSize: DashboardWidgetSize
  defaultSection: DashboardSectionId
  preview?: string
  keywords?: string[]
  component: React.ComponentType<DashboardWidgetComponentProps>
}

export const DASHBOARD_SECTIONS: Array<{ id: DashboardSectionId; title: string }> = [
  { id: 'operations', title: 'Operations' },
  { id: 'inventory', title: 'Inventory' },
  { id: 'finance', title: 'Finance' },
  { id: 'team', title: 'Team' },
  { id: 'intelligence', title: 'Intelligence' }
]
