import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageProvider'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center">
          <span className="mr-1" aria-hidden>{language === 'is' ? '🇮🇸' : '🇬🇧'}</span>
          <span className="hidden sm:inline" aria-label="language">{language.toUpperCase()}</span>
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as any)}>
          <DropdownMenuRadioItem value="is">🇮🇸 IS</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">🇬🇧 EN</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
