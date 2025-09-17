import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageProvider'
import { IconButton } from '@/components/ui/IconButton'
import { GlobeSoft } from '@/components/icons-soft'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  triggerClassName?: string
}

export function LanguageSwitcher({ className, triggerClassName }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={className}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton
            label="Change language"
            aria-haspopup="menu"
            className={cn('bg-white/5', triggerClassName)}
          >
            <GlobeSoft width={24} height={24} tone={0.12} />
          </IconButton>
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
    </div>
  )
}
