
import React from 'react'
import { Input } from '@/components/ui/input'

interface QuickSearchProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function QuickSearch({ value, onChange, placeholder = "Search...", className }: QuickSearchProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  )
}
