import React from 'react'

export function AppChrome() {
  return (
    <>
      {/* Cyan stripe - moves with the chrome */}
      <div
        data-chrome-layer
        className="fixed top-0 z-[var(--z-stripe,56)] h-[2px] pointer-events-none"
        style={{
          left: 'var(--header-left, 0px)',
          right: 'var(--header-right, 0px)',
          transform: 'translateY(calc(-1 * var(--hdr-p, 0) * var(--header-h, 56px)))',
          background:
            'linear-gradient(90deg, rgba(165, 243, 252, 0.63) 0%, rgba(34, 211, 238, 0.9) 50%, rgba(165, 243, 252, 0.63) 100%)',
        }}
      />
      
      {/* Chrome gradient background - confined to content area */}
      <div
        data-chrome-layer
        className="fixed top-0 z-[var(--z-chrome,20)] overflow-hidden pointer-events-none"
        style={{
          left: 'var(--header-left, 0px)',
          right: 'var(--header-right, 0px)',
          height: 'clamp(44px, var(--toolbar-h, 56px), 72px)',
          transform: 'translateY(calc(-1 * var(--hdr-p, 0) * var(--header-h, 56px)))',
          opacity: 'calc(1 - (0.05 * var(--hdr-p, 0)))',
        }}
        aria-hidden
      >
        {/* gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, #0B1220 0%, #0C1729 32%, #0D2142 68%, #103A6B 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(140% 100% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 60%)',
            opacity: 0.18,
          }}
        />
        {/* subtle separator at chrome bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
    </>
  )
}

export default AppChrome
