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
          variant="ghost"
          size="sm"
          className="h-10 px-3 rounded-xl bg-white/6 hover:bg-white/10 ring-1 ring-white/10 text-slate-100 flex items-center focus-visible:ring-2 focus-visible:ring-cyan-400/70"
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
