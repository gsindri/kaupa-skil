import { lockScroll, unlockScroll } from '../lockScroll'

describe('lockScroll', () => {
  beforeEach(() => {
    document.body.innerHTML = `<header id="hdr" style="position:fixed;top:0;left:0;width:100vw;height:50px;"></header>` +
      `<main class="app-scroll" style="height:100vh;overflow-y:auto"><div style="height:200vh"></div></main>`
  })

  it('locks the scroll container without touching the body', () => {
    const header = document.getElementById('hdr') as HTMLElement
    const scroll = document.querySelector('.app-scroll') as HTMLElement
    scroll.scrollTop = 100
    const rectBefore = header.getBoundingClientRect()
    const widthBefore = window.innerWidth

    lockScroll(scroll)
    expect(document.body.style.overflow).toBe('')
    expect(scroll.style.overflow).toBe('hidden')
    expect(scroll.style.touchAction).toBe('none')
    expect(scroll.getAttribute('data-scroll-locked')).toBe('1')

    // simulate scroll attempt while locked
    scroll.scrollTop = 200

    unlockScroll(scroll)
    expect(scroll.scrollTop).toBe(100)
    expect(scroll.style.overflow).toBe('')
    expect(scroll.style.touchAction).toBe('')
    expect(scroll.getAttribute('data-scroll-locked')).toBeNull()

    const rectAfter = header.getBoundingClientRect()
    expect(rectAfter.left).toBe(rectBefore.left)
    expect(rectAfter.width).toBe(rectBefore.width)
    expect(window.innerWidth).toBe(widthBefore)
  })
})
