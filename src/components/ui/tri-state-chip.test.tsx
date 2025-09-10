import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { TriStateChip } from './tri-state-chip'
import type { TriState } from '@/state/catalogFiltersStore'

describe('TriStateChip', () => {
  it('cycles through states on click and right-click', async () => {
    function Wrapper() {
      const [state, setState] = React.useState<TriState>('off')
      return (
        <TriStateChip
          state={state}
          onStateChange={setState}
          includeLabel="Yes"
          excludeLabel="No"
          offLabel="All"
        />
      )
    }

    render(<Wrapper />)
    const btn = screen.getByRole('button', { name: 'All filter off' })

    await userEvent.click(btn)
    expect(btn).toHaveTextContent('Yes')

    await userEvent.click(btn)
    expect(btn).toHaveTextContent('No')

    await userEvent.click(btn)
    expect(btn).toHaveTextContent('All')

    fireEvent.contextMenu(btn)
    expect(btn).toHaveTextContent('No')

    fireEvent.contextMenu(btn)
    expect(btn).toHaveTextContent('Yes')
  })
})
