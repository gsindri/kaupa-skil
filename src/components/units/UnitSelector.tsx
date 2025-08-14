
import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Unit {
  code: string
  name: string
  baseUnit: string
}

interface BaseUnitGroup {
  baseUnit: string
  units: Unit[]
}

interface UnitSelectorProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  baseUnits: BaseUnitGroup[]
  placeholder?: string
}

export function UnitSelector({ 
  label, 
  value, 
  onValueChange, 
  baseUnits, 
  placeholder = "Select unit" 
}: UnitSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {baseUnits.map(group => (
            <div key={group.baseUnit}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {group.baseUnit.toUpperCase()}
              </div>
              {group.units.map(unit => (
                <SelectItem key={unit.code} value={unit.code}>
                  {unit.name} ({unit.code})
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
