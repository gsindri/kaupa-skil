import { useState } from 'react'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from '@/state/catalogFiltersStore'

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
    value?: string
    placeholder?: string
  }[]
}

export function AdvancedFilters({ className }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  
  const { filters, setFilters } = useCatalogFilters()

  // Local state for number inputs
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [moq, setMoq] = useState('')
  const [leadTime, setLeadTime] = useState('')

  const handleCheckboxChange = (category: string, filterId: string, checked: boolean) => {
    const newFilters = { ...filters }
    
    if (category === 'dietary' || category === 'quality' || category === 'lifecycle') {
      const current = newFilters[category] || []
      newFilters[category] = checked 
        ? [...current, filterId]
        : current.filter(v => v !== filterId)
    } else if (category === 'operational') {
      const current = newFilters.operational || {}
      newFilters.operational = { ...current, [filterId]: checked }
    } else if (category === 'dataQuality') {
      const current = newFilters.dataQuality || {}
      newFilters.dataQuality = { ...current, [filterId]: checked }
    }
    
    setFilters(newFilters)
  }

  const handleApplyPrice = () => {
    const min = priceMin ? parseFloat(priceMin) : undefined
    const max = priceMax ? parseFloat(priceMax) : undefined
    setFilters({ priceRange: min || max ? { min, max } : null })
    announceToScreenReader('Price range filter applied')
  }

  const handleApplyMOQ = () => {
    const value = moq ? parseInt(moq) : undefined
    setFilters({ operational: { ...filters.operational, moq: value } })
    announceToScreenReader('MOQ filter applied')
  }

  const handleApplyLeadTime = () => {
    const value = leadTime ? parseInt(leadTime) : undefined
    setFilters({ operational: { ...filters.operational, leadTimeDays: value } })
    announceToScreenReader('Lead time filter applied')
  }

  const sections: AdvancedSection[] = [
    {
      id: 'pricing',
      title: 'Price Intelligence',
      filters: [
        { id: 'price_min', label: 'Min price (ISK)', type: 'number', value: priceMin, placeholder: 'e.g., 100' },
        { id: 'price_max', label: 'Max price (ISK)', type: 'number', value: priceMax, placeholder: 'e.g., 5000' },
      ],
    },
    {
      id: 'dietary',
      title: 'Dietary & Allergens',
      filters: [
        { id: 'vegan', label: 'Vegan', type: 'checkbox', checked: filters.dietary?.includes('vegan') },
        { id: 'vegetarian', label: 'Vegetarian', type: 'checkbox', checked: filters.dietary?.includes('vegetarian') },
        { id: 'gluten_free', label: 'Gluten-free', type: 'checkbox', checked: filters.dietary?.includes('gluten_free') },
        { id: 'halal', label: 'Halal', type: 'checkbox', checked: filters.dietary?.includes('halal') },
      ],
    },
    {
      id: 'quality',
      title: 'Quality & Origin',
      filters: [
        { id: 'organic', label: 'Organic certified', type: 'checkbox', checked: filters.quality?.includes('organic') },
        { id: 'icelandic', label: 'Icelandic origin', type: 'checkbox', checked: filters.quality?.includes('icelandic') },
        { id: 'eco_friendly', label: 'Eco-friendly', type: 'checkbox', checked: filters.quality?.includes('eco_friendly') },
        { id: 'fair_trade', label: 'Fairtrade', type: 'checkbox', checked: filters.quality?.includes('fair_trade') },
      ],
    },
    {
      id: 'operational',
      title: 'Operations',
      filters: [
        { id: 'moq', label: 'Max MOQ', type: 'number', value: moq, placeholder: 'e.g., 12' },
        { id: 'lead_time', label: 'Max lead time (days)', type: 'number', value: leadTime, placeholder: 'e.g., 7' },
        { id: 'caseBreak', label: 'Case-break allowed', type: 'checkbox', checked: filters.operational?.caseBreak },
        { id: 'directDelivery', label: 'Direct delivery', type: 'checkbox', checked: filters.operational?.directDelivery },
        { id: 'sameDay', label: 'Same day available', type: 'checkbox', checked: filters.operational?.sameDay },
      ],
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle',
      filters: [
        { id: 'new_item', label: 'New items', type: 'checkbox', checked: filters.lifecycle?.includes('new_item') },
        { id: 'discontinued', label: 'Discontinued', type: 'checkbox', checked: filters.lifecycle?.includes('discontinued') },
        { id: 'seasonal', label: 'Seasonal (in season)', type: 'checkbox', checked: filters.lifecycle?.includes('seasonal') },
      ],
    },
    {
      id: 'data_quality',
      title: 'Data Quality',
      filters: [
        { id: 'hasImage', label: 'Has image', type: 'checkbox', checked: filters.dataQuality?.hasImage },
        { id: 'hasPrice', label: 'Has price', type: 'checkbox', checked: filters.dataQuality?.hasPrice },
        { id: 'hasDescription', label: 'Has description', type: 'checkbox', checked: filters.dataQuality?.hasDescription },
      ],
    },
  ]

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  // Count active filters
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
                            checked={filter.checked || false}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(section.id, filter.id, !!checked)
                            }
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
                              value={filter.value || ''}
                              onChange={(e) => {
                                if (filter.id === 'price_min') setPriceMin(e.target.value)
                                else if (filter.id === 'price_max') setPriceMax(e.target.value)
                                else if (filter.id === 'moq') setMoq(e.target.value)
                                else if (filter.id === 'lead_time') setLeadTime(e.target.value)
                              }}
                              placeholder={filter.placeholder}
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (filter.id === 'price_min' || filter.id === 'price_max') handleApplyPrice()
                                else if (filter.id === 'moq') handleApplyMOQ()
                                else if (filter.id === 'lead_time') handleApplyLeadTime()
                              }}
                              className="h-8 px-3 text-xs"
                            >
                              Apply
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
