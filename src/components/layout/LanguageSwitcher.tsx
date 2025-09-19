import { Check, ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageProvider'
import { cn } from '@/lib/utils'

import { PopCard } from './PopCard'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
  navTextCaretClass,
} from './navStyles'

interface LanguageSwitcherProps {
  className?: string
  triggerClassName?: string
}

const languageOptions = [
  { value: 'is', label: 'Icelandic', flag: 'is' },
  { value: 'en', label: 'English', flag: 'gb' },
] as const

export function LanguageSwitcher({ className, triggerClassName }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  const activeLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[0]

  return (
    <div className={className}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(navTextButtonClass, 'px-3', triggerClassName)}
            aria-haspopup="menu"
            title="Language"
            aria-label={`Change language (currently ${activeLanguage.label})`}
          >
            <span className={navTextButtonPillClass} aria-hidden="true" />
            <span
              className={cn(
                'fi',
                `fi-${activeLanguage.flag}`,
                'shrink-0 overflow-hidden rounded-[4px] text-[16px]',
                'ring-1 ring-inset ring-[color:var(--surface-ring)]',
                'transition-transform duration-150 ease-out',
                'group-hover:translate-x-[1px] group-active:translate-x-[2px]',
                'motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-active:translate-x-0',
              )}
              aria-hidden="true"
            />
            <span className="truncate">{activeLanguage.label}</span>
            <ChevronDown className={navTextCaretClass} aria-hidden="true" />
            <span className={navTextButtonFocusRingClass} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <PopCard className="w-[240px]" sideOffset={12} align="end">
          <div className="tw-label normal-case">Language</div>
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
                  <span className="flex size-8 items-center justify-center" aria-hidden="true">
                    <span
                      className={cn(
                        'fi',
                        `fi-${option.flag}`,
                        'block shrink-0 overflow-hidden rounded-[4px] text-[18px]',
                        'ring-1 ring-inset ring-[color:var(--surface-ring)]',
                      )}
                    />
                  </span>
                  <span className="truncate">{option.label}</span>
                  <Check
                    aria-hidden="true"
                    className={cn(
                      'h-3.5 w-3.5 justify-self-end text-[color:var(--brand-accent)] transition-opacity',
                      language === option.value ? 'opacity-80' : 'opacity-0',
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
