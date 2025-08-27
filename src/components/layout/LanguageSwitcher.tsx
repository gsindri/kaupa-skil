import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageProvider'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center flex-shrink-0 border-border focus-visible:ring-brand/50"
          aria-label="Language"
        >
          <span>{language === 'is' ? 'Icelandic' : 'English'}</span>
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={8}
        collisionPadding={8}
        sticky="partial"
        className="min-w-[200px]"
      >
        <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as any)}>
          <DropdownMenuRadioItem value="is">Icelandic</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
