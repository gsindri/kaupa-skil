import { render, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Drawer, DrawerContent } from './drawer'

describe('Drawer', () => {
  it('locks body scroll when open', async () => {
    const { unmount } = render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent>content</DrawerContent>
      </Drawer>
    )
    await waitFor(() =>
      expect(document.body.getAttribute('data-scroll-locked')).toBe('1')
    )
    unmount()
    await waitFor(() =>
      expect(document.body.getAttribute('data-scroll-locked')).toBeNull()
    )
  })
})

