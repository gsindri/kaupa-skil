import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Drawer, DrawerContent } from './drawer'

describe('Drawer', () => {
  it('does not mutate body styles when open', () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent>content</DrawerContent>
      </Drawer>
    )
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')
  })
})

