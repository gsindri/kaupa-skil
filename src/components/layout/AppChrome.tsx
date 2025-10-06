import React from 'react'

export function AppChrome() {
  return (
    <>
      {/* Cyan stripe - moves with the chrome */}
      <div
        data-chrome-layer
        className="fixed top-0 z-[var(--z-stripe,56)] h-[2px] pointer-events-none transition-transform duration-200 ease-in-out motion-reduce:transition-none"
        style={{
          left: 'var(--header-left, 0px)',
          right: 'var(--header-right, 0px)',
          transform: 'translate3d(0, calc(-1 * var(--header-hidden, 0) * var(--header-h, 56px)), 0)',
          background:
            'linear-gradient(90deg, rgba(255, 196, 148, 0.45) 0%, rgba(255, 140, 0, 0.7) 50%, rgba(255, 196, 148, 0.45) 100%)',
        }}
      />
      
      {/* Chrome gradient background - confined to content area */}
      <div
        data-chrome-layer
        className="fixed top-0 z-[var(--z-chrome,20)] overflow-hidden pointer-events-none transition-[transform,opacity] duration-200 ease-in-out motion-reduce:transition-none"
        style={{
          left: 'var(--header-left, 0px)',
          right: 'var(--header-right, 0px)',
          height: 'clamp(44px, var(--toolbar-h, 56px), 72px)',
          transform: 'translate3d(0, calc(-1 * var(--header-hidden, 0) * var(--header-h, 56px)), 0)',
          opacity: 'calc(1 - (0.05 * var(--header-hidden, 0)))',
        }}
        aria-hidden
      >
        {/* gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'var(--topbar-bg, linear-gradient(128deg, #071021 0%, #0a1628 32%, #102642 66%, #153b63 100%))',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(140% 120% at 48% -10%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 65%)',
            opacity: 0.14,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(40, 215, 255, 0.1) 0%, rgba(40, 215, 255, 0.04) 28%, rgba(10, 27, 45, 0) 70%)',
          }}
        />
        {/* subtle separator at chrome bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
    </>
  )
}

export default AppChrome
