import React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageProvider'
import { useTranslation } from '@/lib/i18n'
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
  labelClassName?: string
  caretClassName?: string
}

export function LanguageSwitcher({
  className,
  triggerClassName,
  labelClassName,
  caretClassName
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(undefined, { keyPrefix: 'common.language' })
  const options = React.useMemo(
    () => [
      { value: 'is', label: t('options.is'), flag: 'is' },
      { value: 'en', label: t('options.en'), flag: 'gb' }
    ] as const,
    [t]
  )

  const activeLanguage = options.find(option => option.value === language) ?? options[0]

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(navTextButtonClass, 'px-3', triggerClassName)}
            aria-haspopup="menu"
            title={t('label')}
            aria-label={t('ariaLabel', {
              language: activeLanguage.label
            })}
          >
            <span className={navTextButtonPillClass} aria-hidden="true" />
            <span
              className={cn(
                'fi',
                `fi-${activeLanguage.flag}`,
                'shrink-0 overflow-hidden rounded-[4px] text-[16px]',
                'ring-1 ring-inset ring-[color:var(--surface-ring)]',
                'transition-colors duration-150 ease-out'
              )}
              aria-hidden="true"
            />
            <span className={cn('truncate', labelClassName)}>{activeLanguage.label}</span>
            <ChevronDown
              className={cn(navTextCaretClass, caretClassName)}
              aria-hidden="true"
            />
            <span className={navTextButtonFocusRingClass} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <PopCard className="w-[240px]" sideOffset={12} align="end" withOverlay>
          <div className="tw-label normal-case">{t('label')}</div>
          <div className="flex flex-col gap-1 px-1">
            {options.map((option) => (
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
