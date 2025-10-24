export const navTextButtonClass = [
  'group relative inline-flex h-11 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full px-4 bg-transparent',
  'text-[14px] font-medium text-[color:var(--nav-text-color,var(--ink-dim,#cfd7e4))]',
  'transition-[color,background-color,transform,outline,box-shadow] duration-150 ease-out',
  'outline-none hover:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))] focus-visible:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))]',
  'data-[state=open]:font-semibold data-[state=open]:z-[1]',
  'data-[state=open]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))] data-[active=true]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))]',
  'data-[state=open]:[box-shadow:0_12px_32px_-16px_rgba(15,23,42,0.48),_0_0_0_1px_rgba(255,255,255,0.28)]',
  'aria-[current=true]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))] aria-[current=page]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))]'
].join(' ')

export const navTextButtonPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full',
  'bg-transparent ring-1 ring-inset ring-transparent',
  'transition-[background-color,border-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-[color:var(--bg-pill,rgba(255,255,255,0.08))]',
  'group-focus-visible:bg-[color:var(--bg-pill,rgba(255,255,255,0.08))]',
  'group-active:bg-[color:var(--bg-pill-strong,rgba(255,255,255,0.12))]',
  'data-[state=open]:bg-[color:var(--bg-pill-open,rgba(255,255,255,0.2))]',
  'group-data-[state=open]:bg-[color:var(--bg-pill-open,rgba(255,255,255,0.2))]',
  'data-[active=true]:bg-[color:var(--bg-pill-strong,rgba(255,255,255,0.12))]',
  'aria-[current=true]:bg-[color:var(--bg-pill-strong,rgba(255,255,255,0.12))]',
  'aria-[current=page]:bg-[color:var(--bg-pill-strong,rgba(255,255,255,0.12))]',
  'group-hover:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]',
  'group-focus-visible:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]',
  'group-active:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]',
  'data-[state=open]:ring-[color:hsl(var(--ring-open,0_0%_100%_/_.32))]',
  'group-data-[state=open]:ring-[color:hsl(var(--ring-open,0_0%_100%_/_.32))]',
  'data-[active=true]:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]',
  'aria-[current=true]:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]',
  'aria-[current=page]:ring-[color:hsl(var(--ring,0_0%_100%_/_.22))]'
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
  'group-data-[state=open]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))] group-data-[active=true]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))]',
  'group-aria-[current=true]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))] group-aria-[current=page]:text-[color:var(--nav-text-strong-color,var(--ink,#eaf0f7))]'
].join(' ')

export const navTextCaretClass = [
  navTextIconClass,
  'text-[color:var(--nav-text-caret-color,var(--nav-text-color,var(--ink-dim,#cfd7e4))))] group-data-[state=open]:rotate-180'
].join(' ')

export const navQuietLinkClass = [
  'group relative inline-flex h-9 min-h-[36px] items-center rounded-full px-2',
  'text-[14px] font-medium text-[color:var(--ink-dim,#cfd7e4)] transition-colors duration-150 ease-out',
  'hover:text-[color:var(--ink,#eaf0f7)] focus-visible:text-[color:var(--ink,#eaf0f7)]',
  'outline-none'
].join(' ')

export const navQuietLinkPillClass = [
  'pointer-events-none absolute inset-0 -z-10 rounded-full bg-transparent',
  'transition-[background-color,box-shadow] duration-150 ease-out',
  'group-hover:bg-[color:var(--bg-pill,rgba(255,255,255,0.08))]',
  'group-focus-visible:bg-[color:var(--bg-pill,rgba(255,255,255,0.08))]'
].join(' ')
