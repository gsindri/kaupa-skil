
import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface QuickSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function QuickSearch({ value, onChange, placeholder = "Search by name, SKU, or EAN..." }: QuickSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-12 text-base"
      />
    </div>
  )
}
