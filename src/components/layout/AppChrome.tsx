import React from 'react'

export function AppChrome() {
  return (
    <>
      {/* Cyan stripe - moves with the chrome */}
      <div
        data-chrome-layer
        className="absolute top-0 z-[var(--z-stripe,56)] h-[2px] pointer-events-none duration-200 ease-in-out motion-reduce:transition-none"
        style={{
          left: 'calc(-1 * var(--layout-rail, 72px))',
          right: 0,
          background:
            'linear-gradient(90deg, rgba(255, 196, 148, 0.45) 0%, rgba(255, 140, 0, 0.7) 50%, rgba(255, 196, 148, 0.45) 100%)',
        }}
      />
      
      {/* Gradient background rendered within TopNavigation */}
    </>
  )
}

export default AppChrome
