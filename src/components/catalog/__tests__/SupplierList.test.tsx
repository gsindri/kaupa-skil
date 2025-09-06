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
})
