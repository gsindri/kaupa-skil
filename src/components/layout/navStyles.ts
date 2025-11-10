export const navTextButtonClass = [
  'group relative inline-flex h-11 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full px-4 bg-transparent',
  'text-[14px] font-medium text-[color:var(--nav-text-color)]',
  'transition-[color,background-color,transform,outline,box-shadow] duration-150 ease-out',
  'outline-none hover:text-[color:var(--nav-text-strong-color)] focus-visible:text-[color:var(--nav-text-strong-color)]',
  'data-[state=open]:font-semibold data-[state=open]:z-[1]',
  'data-[state=open]:text-[color:var(--nav-text-strong-color)] data-[active=true]:text-[color:var(--nav-text-strong-color)]',
  'data-[state=open]:[box-shadow:0_12px_32px_-16px_rgba(15,23,42,0.48),_0_0_0_1px_rgba(255,255,255,0.28)]',
  'aria-[current=true]:text-[color:var(--nav-text-strong-color)] aria-[current=page]:text-[color:var(--nav-text-strong-color)]'
].join(' ')

export const navTextButtonPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full',
  'bg-transparent ring-1 ring-inset ring-transparent',
  'transition-[background-color,border-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-[var(--bg-pill)]',
  'group-focus-visible:bg-[var(--bg-pill)]',
  'group-active:bg-[var(--bg-pill-strong)]',
  'data-[state=open]:bg-[var(--bg-pill-open)]',
  'group-data-[state=open]:bg-[var(--bg-pill-open)]',
  'data-[active=true]:bg-[var(--bg-pill-strong)]',
  'aria-[current=true]:bg-[var(--bg-pill-strong)]',
  'aria-[current=page]:bg-[var(--bg-pill-strong)]',
  'group-hover:ring-[color:hsl(var(--topbar-ring))]',
  'group-active:ring-[color:hsl(var(--topbar-ring))]',
  'data-[state=open]:ring-[color:hsl(var(--topbar-ring-open))]',
  'group-data-[state=open]:ring-[color:hsl(var(--topbar-ring-open))]',
  'data-[active=true]:ring-[color:hsl(var(--topbar-ring))]',
  'aria-[current=true]:ring-[color:hsl(var(--topbar-ring))]',
  'aria-[current=page]:ring-[color:hsl(var(--topbar-ring))]'
].join(' ')

export const navTextButtonFocusRingClass = [
  'pointer-events-none absolute inset-0 rounded-full',
  'ring-0 ring-transparent transition duration-150 ease-out',
  'group-focus-visible:ring-2 group-focus-visible:ring-[color:hsl(var(--accent,38_92%_50%))]',
  'group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent'
].join(' ')

export const navTextIconClass = [
  'size-4 shrink-0 opacity-80',
  'transition-[color,transform] duration-150 ease-out',
  'motion-reduce:transition-none',
  'group-data-[state=open]:text-[color:var(--nav-text-strong-color)] group-data-[active=true]:text-[color:var(--nav-text-strong-color)]',
  'group-aria-[current=true]:text-[color:var(--nav-text-strong-color)] group-aria-[current=page]:text-[color:var(--nav-text-strong-color)]'
].join(' ')

export const navTextCaretClass = [
  navTextIconClass,
  'text-[color:var(--nav-text-caret-color)] group-data-[state=open]:rotate-180'
].join(' ')

export const navQuietLinkClass = [
  'group relative inline-flex h-9 min-h-[36px] items-center rounded-full px-2',
  'text-[14px] font-medium text-[color:var(--ink-dim)] transition-colors duration-150 ease-out',
  'hover:text-[color:var(--ink)] focus-visible:text-[color:var(--ink)]',
  'outline-none'
].join(' ')

export const navQuietLinkPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full bg-transparent',
  'transition-[background-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-[var(--bg-pill)]',
  'group-focus-visible:bg-[var(--bg-pill)]'
].join(' ')
