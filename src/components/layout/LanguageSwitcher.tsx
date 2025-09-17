import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { GlobeHemisphereWest } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageProvider'
import { Icon } from '@/components/ui/Icon'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full ring-1 ring-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:ring-white/20 hover:text-white p-0"
          aria-label="Change language"
        >
          <Icon size={22} aria-hidden="true">
            <GlobeHemisphereWest weight="duotone" />
          </Icon>
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
