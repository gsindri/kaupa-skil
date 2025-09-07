import { lockScroll, unlockScroll } from '../lockScroll'

describe('lockScroll', () => {
  beforeEach(() => {
    document.body.innerHTML = `<header id="hdr" style="position:fixed;top:0;left:0;width:100vw;height:50px;"></header>` +
      `<main style="min-height:200vh"></main>`
  })

  it('locks the window scroll without touching the body', () => {
    const header = document.getElementById('hdr') as HTMLElement
    document.documentElement.scrollTop = 100
    const rectBefore = header.getBoundingClientRect()
    const widthBefore = window.innerWidth

    lockScroll()
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.touchAction).toBe('none')
    expect(document.documentElement.getAttribute('data-scroll-locked')).toBe('1')

    // simulate scroll attempt while locked
    document.documentElement.scrollTop = 200

    unlockScroll()
    expect(document.documentElement.scrollTop).toBe(100)
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.documentElement.style.touchAction).toBe('')
    expect(document.documentElement.getAttribute('data-scroll-locked')).toBeNull()

    const rectAfter = header.getBoundingClientRect()
    expect(rectAfter.left).toBe(rectBefore.left)
    expect(rectAfter.width).toBe(rectBefore.width)
    expect(window.innerWidth).toBe(widthBefore)
  })
})
