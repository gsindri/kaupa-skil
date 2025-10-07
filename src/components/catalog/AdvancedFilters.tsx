import { useState } from 'react'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AdvancedFiltersProps {
  className?: string
}

interface AdvancedSection {
  id: string
  title: string
  filters: {
    id: string
    label: string
    type: 'checkbox' | 'number'
    checked?: boolean
    value?: number
    placeholder?: string
  }[]
}

export function AdvancedFilters({ className }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [isApplyingMOQ, setIsApplyingMOQ] = useState(false)
  const [isApplyingLeadTime, setIsApplyingLeadTime] = useState(false)
  const sections: AdvancedSection[] = [
    {
      id: 'dietary',
      title: 'Dietary & Allergens',
      filters: [
        { id: 'vegan', label: 'Vegan', type: 'checkbox', checked: false },
        { id: 'vegetarian', label: 'Vegetarian', type: 'checkbox', checked: false },
        { id: 'gluten_free', label: 'Gluten-free', type: 'checkbox', checked: false },
        { id: 'lactose_free', label: 'Lactose-free', type: 'checkbox', checked: false },
        { id: 'halal', label: 'Halal', type: 'checkbox', checked: false },
        { id: 'kosher', label: 'Kosher', type: 'checkbox', checked: false },
      ],
    },
    {
      id: 'quality',
      title: 'Quality & Origin',
      filters: [
        { id: 'organic', label: 'Organic certified', type: 'checkbox', checked: false },
        { id: 'msc', label: 'MSC certified', type: 'checkbox', checked: false },
        { id: 'fairtrade', label: 'Fairtrade', type: 'checkbox', checked: false },
        { id: 'local', label: 'Local origin', type: 'checkbox', checked: false },
      ],
    },
    {
      id: 'operations',
      title: 'Operations',
      filters: [
        { id: 'moq', label: 'Max MOQ', type: 'number', value: undefined, placeholder: 'e.g., 12' },
        { id: 'lead_time', label: 'Max lead time (days)', type: 'number', value: undefined, placeholder: 'e.g., 7' },
        { id: 'case_break', label: 'Case-break allowed', type: 'checkbox', checked: false },
        { id: 'next_delivery', label: 'Matches delivery schedule', type: 'checkbox', checked: false },
      ],
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle',
      filters: [
        { id: 'new_this_month', label: 'New this month', type: 'checkbox', checked: false },
        { id: 'back_in_stock', label: 'Back in stock', type: 'checkbox', checked: false },
        { id: 'seasonal', label: 'Seasonal (in season)', type: 'checkbox', checked: false },
      ],
    },
    {
      id: 'data_quality',
      title: 'Data Quality',
      filters: [
        { id: 'has_image', label: 'Has image', type: 'checkbox', checked: false },
        { id: 'has_nutrition', label: 'Has nutrition info', type: 'checkbox', checked: false },
        { id: 'has_spec', label: 'Has spec sheet', type: 'checkbox', checked: false },
      ],
    },
  ]

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  // Apply handlers with loading states
  const handleApplyMOQ = async () => {
    setIsApplyingMOQ(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    announceToScreenReader('Minimum order quantity filter applied')
    setIsApplyingMOQ(false)
  }

  const handleApplyLeadTime = async () => {
    setIsApplyingLeadTime(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    announceToScreenReader('Lead time filter applied')
    setIsApplyingLeadTime(false)
  }

  // Count active advanced filters (for future use)
  const activeCount = sections.reduce((acc, section) => {
    return acc + section.filters.filter(f => f.type === 'checkbox' && f.checked).length
  }, 0)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('rounded-2xl border border-white/8 bg-white/4', className)}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-[color:var(--ink-hi)] transition hover:bg-white/5"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <span>Advanced Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent-fill)] px-2 py-0.5 text-xs font-semibold text-[color:var(--accent-ink)]">
                {activeCount}
              </span>
            )}
          </div>
          <CaretDown
            size={18}
            className={cn(
              'shrink-0 text-[color:var(--ink-dim)]/80 transition-transform duration-150 ease-out',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-3">
        <div className="space-y-3 pt-2">
          {sections.map(section => (
            <div key={section.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-dim)]/70 hover:text-[color:var(--ink-dim)]"
              >
                <span>{section.title}</span>
                <CaretDown
                  size={14}
                  className={cn(
                    'shrink-0 transition-transform duration-150',
                    openSections[section.id] ? 'rotate-0' : '-rotate-90'
                  )}
                  aria-hidden
                />
              </button>

              {openSections[section.id] && (
                <div className="space-y-2 pl-2">
                  {section.filters.map(filter => (
                    <div key={filter.id}>
                      {filter.type === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`adv-${filter.id}`}
                            checked={filter.checked}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`adv-${filter.id}`}
                            className="text-sm text-[color:var(--ink)] cursor-pointer select-none"
                          >
                            {filter.label}
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label
                            htmlFor={`adv-${filter.id}`}
                            className="text-xs font-medium text-[color:var(--ink-dim)]"
                          >
                            {filter.label}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              id={`adv-${filter.id}`}
                              type="number"
                              value={filter.value ?? ''}
                              placeholder={filter.placeholder}
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={filter.id === 'moq' ? handleApplyMOQ : handleApplyLeadTime}
                              disabled={filter.id === 'moq' ? isApplyingMOQ : isApplyingLeadTime}
                              className="h-8 px-3 text-xs"
                            >
                              {(filter.id === 'moq' ? isApplyingMOQ : isApplyingLeadTime) ? 'Applying...' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
