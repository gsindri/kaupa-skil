import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import SupplierChips from '../SupplierChips'

describe('SupplierChips', () => {
  it('renders logo when supplier_logo_url provided', () => {
    const suppliers = [
      {
        supplier_id: '1',
        supplier_name: 'Logo Supplier',
        supplier_logo_url: 'https://example.com/logo.png',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.queryByText('LS')).toBeNull()
  })

  it('falls back to initials when no logo', () => {
    const suppliers = [
      {
        supplier_id: '2',
        supplier_name: 'No Logo',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.getByText('NL')).toBeInTheDocument()
  })
})
