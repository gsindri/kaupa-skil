import React from 'react'

export function AppChrome() {
  return (
    <>
      {/* Cyan stripe - moves with the chrome */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-cyan-300/70 via-cyan-400 to-cyan-300/70 pointer-events-none"
        style={{
          transform: 'translateY(calc(-1 * var(--hdr-p, 0) * var(--header-h, 56px)))',
        }}
      />
      
      {/* Chrome gradient background - scoped to right column */}
      <div
        className="fixed top-0 left-0 right-0 z-[var(--z-chrome,20)] pointer-events-none overflow-hidden"
        style={{
          height: 'clamp(44px, var(--toolbar-h, 56px), 72px)',
          transform: 'translateY(calc(-1 * var(--hdr-p, 0) * var(--header-h, 56px)))',
        }}
        aria-hidden
      >
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0E1B35] to-[#0E2A5E]" />
        {/* subtle separator at chrome bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>
    </>
  )
}

export default AppChrome
