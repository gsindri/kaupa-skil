
import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface QuickSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function QuickSearch({ value, onChange, placeholder = "Search item / brand / EAN…" }: QuickSearchProps) {
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
        className="h-11 rounded-lg pl-10 text-base focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:shadow-focus transition-all duration-200"
      />
    </div>
  )
}
