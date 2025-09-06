import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import SupplierList from '../SupplierList'
import { vi } from 'vitest'

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: (props: any) => <img {...props} />,
  AvatarFallback: (props: any) => <span {...props} />,
}))

describe('SupplierList', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('renders AvatarImage when logoUrl provided', () => {
    const suppliers = [
      {
        name: 'Logo Supplier',
        logoUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAEklEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
        connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierList suppliers={suppliers} />
      </TooltipProvider>
    )
    const img = screen.getByRole('img', { name: 'Logo Supplier' })
    expect(img).toHaveAttribute('src')
    expect(screen.queryByText('LS')).toBeNull()
  })

  it('renders initials when logoUrl absent', () => {
    const suppliers = [{ name: 'No Logo', connected: true }]
    render(
      <TooltipProvider>
        <SupplierList suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.getByText('NL')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'No Logo' })).toBeNull()
  })

  it('renders AvatarImage when logo_url provided', () => {
    const suppliers = [
      {
        name: 'Snake Supplier',
        logo_url:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAEklEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
        connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierList suppliers={suppliers} />
      </TooltipProvider>
    )
    const img = screen.getByRole('img', { name: 'Snake Supplier' })
    expect(img).toHaveAttribute('src')
    expect(screen.queryByText('SS')).toBeNull()
  })

  it('renders AvatarImage when supplier is string with matching vendor logo', () => {
    const vendor = {
      id: '1',
      name: 'String Vendor',
      logo_url:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAEklEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
    }
    localStorage.setItem('connected-vendors', JSON.stringify([vendor]))
    const suppliers = ['String Vendor']
    render(
      <TooltipProvider>
        <SupplierList suppliers={suppliers} />
      </TooltipProvider>
    )
    const img = screen.getByRole('img', { name: 'String Vendor' })
    expect(img).toHaveAttribute('src')
    expect(screen.queryByText('SV')).toBeNull()
  })
})
