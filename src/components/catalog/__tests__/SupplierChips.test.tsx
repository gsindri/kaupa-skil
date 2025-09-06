import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import SupplierChips from '../SupplierChips'
import { useVendors } from '@/hooks/useVendors'

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

  it('renders logo when derived from useVendors', () => {
    localStorage.setItem(
      'connected-vendors',
      JSON.stringify([
        {
          id: '3',
          name: 'Vendor With Logo',
          logo_url: 'https://example.com/vendor-logo.png',
        },
      ]),
    )

    function Wrapper() {
      const { vendors } = useVendors()
      const suppliers = [
        {
          supplier_id: '3',
          supplier_name: 'Vendor With Logo',
          supplier_logo_url:
            vendors.find(v => v.name === 'Vendor With Logo')?.logo_url || null,
          is_connected: true,
        },
      ]
      return (
        <TooltipProvider>
          <SupplierChips suppliers={suppliers} />
        </TooltipProvider>
      )
    }

    render(<Wrapper />)
    expect(screen.queryByText('VL')).toBeNull()
    localStorage.removeItem('connected-vendors')
  })
})
