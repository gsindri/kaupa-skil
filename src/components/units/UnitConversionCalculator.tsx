
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeftRight, Calculator } from 'lucide-react'
import { UnitSelector } from './UnitSelector'
import { useUnitConversions } from '@/hooks/useUnitConversions'
import { Badge } from '@/components/ui/badge'

export function UnitConversionCalculator() {
  const {
    inputValue,
    setInputValue,
    fromUnit,
    setFromUnit,
    toUnit,
    setToUnit,
    baseUnits,
    convertedValue,
    handleConvert,
    swapUnits,
    isLoading
  } = useUnitConversions()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Unit Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading units...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Unit Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="input-value">Amount</Label>
            <Input
              id="input-value"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter amount"
              step="any"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={swapUnits}
              disabled={!fromUnit || !toUnit}
              className="w-full"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Swap Units
            </Button>
          </div>
        </div>

        {/* Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UnitSelector
            label="From Unit"
            value={fromUnit}
            onValueChange={setFromUnit}
            baseUnits={baseUnits}
            placeholder="Select source unit"
          />
          <UnitSelector
            label="To Unit"
            value={toUnit}
            onValueChange={setToUnit}
            baseUnits={baseUnits}
            placeholder="Select target unit"
          />
        </div>

        {/* Result Section */}
        {convertedValue !== null && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {convertedValue.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {inputValue} {fromUnit} = {convertedValue.toFixed(4)} {toUnit}
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Examples</Label>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-muted"
              onClick={() => {
                setFromUnit('kg')
                setToUnit('g')
                setInputValue('1')
              }}
            >
              kg → g
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-muted"
              onClick={() => {
                setFromUnit('L')
                setToUnit('ml')
                setInputValue('1')
              }}
            >
              L → ml
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-muted"
              onClick={() => {
                setFromUnit('g')
                setToUnit('kg')
                setInputValue('1000')
              }}
            >
              g → kg
            </Badge>
          </div>
        </div>

        <Button onClick={handleConvert} className="w-full" disabled={!convertedValue}>
          Show Conversion Toast
        </Button>
      </CardContent>
    </Card>
  )
}
