import React from 'react'

export function AppChrome() {
  return (
    <div
      className="
        fixed top-0 left-0 right-0 h-[var(--chrome-h,56px)]
        z-[38]
        pointer-events-none
      "
      aria-hidden
    >
      {/* memory stripe */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#22E0E0] to-[#12B6C5]" />
      {/* gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0E1B35] to-[#0E2A5E]" />
      {/* subtle separator at chrome bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
    </div>
  )
}

export default AppChrome
