import React, { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  quantity: number
  onChange: (qty: number) => void
  label: string
  /** Optional supplier name for accessibility labels */
  supplier?: string
  /** Optional callback when quantity should be removed */
  onRemove?: () => void
  min?: number
  max?: number
  className?: string
}

export function QuantityStepper({
  quantity,
  onChange,
  label,
  supplier,
  onRemove,
  min = 0,
  max = 9999,
  className,
}: QuantityStepperProps) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(String(quantity))

  useEffect(() => {
    if (!editing) {
      setTemp(String(quantity))
    }
  }, [quantity, editing])

  const numericValue = Number(temp)
  const isInvalid = numericValue > max || numericValue < min

  const startEdit = () => {
    setEditing(true)
    setTemp(String(quantity))
  }

  const cancelEdit = () => {
    setEditing(false)
    setTemp(String(quantity))
  }

  const commitEdit = () => {
    const newQty = Math.min(max, Math.max(min, numericValue || 0))
    onChange(newQty)
    setEditing(false)
  }

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const delta = e.shiftKey ? 10 : 1
      const newVal = numericValue + (e.key === 'ArrowUp' ? delta : -delta)
      const clamped = Math.min(max, Math.max(min, newVal))
      setTemp(String(clamped))
    }
  }

  const itemLabel = supplier ? `${label} from ${supplier}` : label

  return (
    <div
      className={cn(
        'relative inline-flex h-7 w-[92px] md:w-[100px] items-center divide-x rounded-md border ring-offset-1 focus-within:ring-2 focus-within:ring-brand/50',
        (quantity === min || isInvalid) && 'border-destructive',
        className,
      )}
    >
      <button
        className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
        aria-label={`Decrease quantity of ${itemLabel}`}
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity === min}
      >
        <Minus className="h-4 w-4 stroke-[1.5]" />
      </button>
      {editing ? (
        <input
          aria-label={`Quantity of ${itemLabel}`}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            'h-full w-full bg-transparent text-center font-mono tabular-nums text-sm focus-visible:outline-none',
            isInvalid && 'text-destructive',
          )}
          value={temp}
          onChange={e => setTemp(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={commitEdit}
          onKeyDown={handleInputKey}
        />
      ) : (
        <span
          aria-label={`Quantity of ${itemLabel}`}
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              startEdit()
            }
          }}
          className="flex h-full flex-1 cursor-text items-center justify-center tabular-nums text-sm"
        >
          {quantity}
        </span>
      )}
      <button
        className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        aria-label={`Increase quantity of ${itemLabel}`}
        onClick={() => onChange(Math.min(max, quantity + 1))}
      >
        <Plus className="h-4 w-4 stroke-[1.5]" />
      </button>
      {isInvalid && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-destructive">
          {numericValue < min ? `Min ${min}` : `Max ${max}`}
        </span>
      )}
    </div>
  )
}

export default QuantityStepper
