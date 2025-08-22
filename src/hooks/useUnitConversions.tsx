
import { useState, useMemo } from 'react'
import { useUnitsVat } from './useUnitsVat'
import { toast } from 'sonner'

export function useUnitConversions() {
  const [inputValue, setInputValue] = useState<string>('1')
  const [fromUnit, setFromUnit] = useState<string>('')
  const [toUnit, setToUnit] = useState<string>('')
  
  const { data, isLoading } = useUnitsVat()
  
  const availableUnits = useMemo(() => {
    if (!data?.units) return []
    return data.units.map(unit => ({
      code: unit.code,
      name: unit.name,
      baseUnit: unit.base_unit || ''
    }))
  }, [data?.units])

  const baseUnits = useMemo(() => {
    const bases = new Set(availableUnits.map(unit => unit.baseUnit).filter(Boolean))
    return Array.from(bases).map(baseUnit => ({
      baseUnit: baseUnit as string,
      units: availableUnits.filter(unit => unit.baseUnit === baseUnit)
    }))
  }, [availableUnits])

  const convertedValue = useMemo(() => {
    if (!data?.engine || !inputValue || !fromUnit || !toUnit) return null
    
    const numericValue = parseFloat(inputValue)
    if (isNaN(numericValue)) return null
    
    try {
      const result = data.engine.convertUnits(numericValue, fromUnit, toUnit)
      return result
    } catch (error) {
      console.warn('Unit conversion error:', error)
      return null
    }
  }, [data?.engine, inputValue, fromUnit, toUnit])

  const handleConvert = () => {
    if (convertedValue === null) {
      toast.error('Cannot convert between these units')
      return
    }
    
    const fromUnitName = availableUnits.find(u => u.code === fromUnit)?.name || fromUnit
    const toUnitName = availableUnits.find(u => u.code === toUnit)?.name || toUnit
    
    toast.success(`${inputValue} ${fromUnitName} = ${convertedValue.toFixed(4)} ${toUnitName}`)
  }

  const swapUnits = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  return {
    inputValue,
    setInputValue,
    fromUnit,
    setFromUnit,
    toUnit,
    setToUnit,
    availableUnits,
    baseUnits,
    convertedValue,
    handleConvert,
    swapUnits,
    isLoading
  }
}
