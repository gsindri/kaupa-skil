import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'

import { TriStateChip } from '../tri-state-chip'

describe('TriStateChip', () => {
  it('cycles through states on click', async () => {
    function Wrapper() {
      const [state, setState] = React.useState<'off' | 'include' | 'exclude'>('off')
      return (
        <TriStateChip
          state={state}
          onStateChange={setState}
          includeLabel="✓ Foo"
          excludeLabel="⨯ Foo"
          offLabel="Foo"
        />
      )
    }

    render(<Wrapper />)
    const btn = screen.getByRole('button', { name: 'Foo filter off' })

    await userEvent.click(btn)
    expect(btn).toHaveTextContent('✓ Foo')
    await userEvent.click(btn)
    expect(btn).toHaveTextContent('⨯ Foo')
    await userEvent.click(btn)
    expect(btn).toHaveTextContent('Foo')
  })
})

