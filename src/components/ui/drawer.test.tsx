import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from './drawer'

describe('Drawer', () => {
  it('does not mutate body styles when open', () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle className="sr-only">title</DrawerTitle>
          <DrawerDescription className="sr-only">description</DrawerDescription>
          content
        </DrawerContent>
      </Drawer>
    )
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')
  })
})

