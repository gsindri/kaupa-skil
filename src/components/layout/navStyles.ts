export const navTextButtonClass = [
  'group relative inline-flex h-11 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full px-4 bg-transparent',
  'text-[14px] font-medium text-nav-text',
  'transition-[color,background-color,transform,outline,box-shadow] duration-150 ease-out',
  'outline-none hover:text-nav-text-strong focus-visible:text-nav-text-strong',
  'data-[state=open]:font-semibold data-[state=open]:z-[1]',
  'data-[state=open]:text-nav-text-strong data-[active=true]:text-nav-text-strong',
  'data-[state=open]:[box-shadow:0_12px_32px_-16px_rgba(15,23,42,0.48),_0_0_0_1px_rgba(255,255,255,0.28)]',
  'aria-[current=true]:text-nav-text-strong aria-[current=page]:text-nav-text-strong'
].join(' ')

export const navTextButtonPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full',
  'bg-transparent ring-1 ring-inset ring-transparent',
  'transition-[background-color,border-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-bg-pill',
  'group-focus-visible:bg-bg-pill',
  'group-active:bg-bg-pill-strong',
  'data-[state=open]:bg-bg-pill-open',
  'group-data-[state=open]:bg-bg-pill-open',
  'data-[active=true]:bg-bg-pill-strong',
  'aria-[current=true]:bg-bg-pill-strong',
  'aria-[current=page]:bg-bg-pill-strong',
  'group-hover:ring-nav-ring-hover',
  'group-active:ring-nav-ring',
  'data-[state=open]:ring-nav-ring-open',
  'group-data-[state=open]:ring-nav-ring-open',
  'data-[active=true]:ring-nav-ring',
  'aria-[current=true]:ring-nav-ring',
  'aria-[current=page]:ring-nav-ring'
].join(' ')

export const navTextButtonFocusRingClass = [
  'pointer-events-none absolute inset-0 rounded-full',
  'ring-0 ring-transparent transition duration-150 ease-out',
  'group-focus-visible:ring-2 group-focus-visible:ring-nav-accent-fill',
  'group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent'
].join(' ')

export const navTextIconClass = [
  'size-4 shrink-0 opacity-80',
  'transition-[color,transform] duration-150 ease-out',
  'motion-reduce:transition-none',
  'group-data-[state=open]:text-nav-text-strong group-data-[active=true]:text-nav-text-strong',
  'group-aria-[current=true]:text-nav-text-strong group-aria-[current=page]:text-nav-text-strong'
].join(' ')

export const navTextCaretClass = [
  navTextIconClass,
  'text-nav-text-caret group-data-[state=open]:rotate-180'
].join(' ')

export const navQuietLinkClass = [
  'group relative inline-flex h-9 min-h-[36px] items-center rounded-full px-2',
  'text-[14px] font-medium text-ink-dim transition-colors duration-150 ease-out',
  'hover:text-ink focus-visible:text-ink',
  'outline-none'
].join(' ')

export const navQuietLinkPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full bg-transparent',
  'transition-[background-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-bg-pill',
  'group-focus-visible:bg-bg-pill'
].join(' ')
