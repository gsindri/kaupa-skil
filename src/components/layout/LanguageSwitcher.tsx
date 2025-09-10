import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageProvider'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 rounded-2xl bg-white/8 hover:bg-white/12 ring-1 ring-white/10 text-slate-100 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21D4D6]"
          aria-label="Change language"
        >
          <Languages className="icon-20" strokeWidth={1.75} />
          <span className="hidden lg:inline ml-2">{language === 'is' ? 'Icelandic' : 'English'}</span>
          <ChevronDown className="hidden lg:inline ml-1 icon-20" strokeWidth={1.75} />
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
