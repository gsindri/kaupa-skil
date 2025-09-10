import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { TriStateChip } from '../tri-state-chip'

describe('TriStateChip', () => {
  it('cycles include/neutral and right-click excludes', async () => {
    function Wrapper() {
      const [v, setV] = React.useState<0|1|-1>(0)
      return <TriStateChip label="Foo" value={v} onChange={setV} />
    }
    render(<Wrapper />)
    const btn = screen.getByRole('switch', { name: 'Foo' })

    await userEvent.click(btn)
    expect(btn).toHaveTextContent('✓ Foo')
    await userEvent.click(btn)
    expect(btn).toHaveTextContent('Foo')

    fireEvent.contextMenu(btn)
    expect(btn).toHaveTextContent('⨯ Foo')
    fireEvent.contextMenu(btn)
    expect(btn).toHaveTextContent('Foo')
  })
})
