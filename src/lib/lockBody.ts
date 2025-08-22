let lockCount = 0
let scrollY = 0
let originalStyle: Partial<CSSStyleDeclaration> = {}

export function lockBody() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) {
    const body = document.body
    scrollY = window.scrollY
    originalStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
  }
  lockCount++
}

export function unlockBody() {
  if (typeof window === 'undefined') return
  if (lockCount > 0) {
    lockCount--
    if (lockCount === 0) {
      const body = document.body
      body.style.position = originalStyle.position ?? ''
      body.style.top = originalStyle.top ?? ''
      body.style.left = originalStyle.left ?? ''
      body.style.right = originalStyle.right ?? ''
      body.style.width = originalStyle.width ?? ''
      window.scrollTo(0, scrollY)
    }
  }
}
