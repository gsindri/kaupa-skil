import { Check, Languages } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/IconButton'
import { useLanguage } from '@/contexts/LanguageProvider'
import { cn } from '@/lib/utils'

import { PopCard } from './PopCard'

interface LanguageSwitcherProps {
  className?: string
  triggerClassName?: string
}

const languageOptions = [
  { value: 'is', label: 'Icelandic', code: 'IS' },
  { value: 'en', label: 'English', code: 'EN' },
] as const

export function LanguageSwitcher({ className, triggerClassName }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={className}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton
            label="Language"
            aria-haspopup="menu"
            aria-label="Change language"
            title="Language"
            className={cn(
              'bg-[color:var(--surface-pop)] text-[color:var(--text)]',
              'border border-[color:var(--surface-ring)] hover:bg-[color:var(--surface-pop-2)]/80',
              triggerClassName,
            )}
          >
            <Languages className="size-5" />
          </IconButton>
        </DropdownMenuTrigger>
        <PopCard className="w-[240px] space-y-2" sideOffset={12} align="end">
          <div className="tw-label">LANGUAGE</div>
          <div className="flex flex-col gap-1 px-1">
            {languageOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => setLanguage(option.value as any)}
                asChild
              >
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === option.value}
                  className="tw-row text-left"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--surface-ring)] text-[11px] font-semibold text-[color:var(--text-muted)]">
                    {option.code}
                  </span>
                  <span className="truncate">{option.label}</span>
                  <Check
                    className={cn(
                      'size-4 text-[color:var(--brand-accent)] transition-opacity',
                      language === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </button>
              </DropdownMenuItem>
            ))}
          </div>
        </PopCard>
      </DropdownMenu>
    </div>
  )
}
