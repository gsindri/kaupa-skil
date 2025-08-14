
import { Outlet } from 'react-router-dom'
import { AppLayout as AppLayoutComponent } from '@/components/layout/AppLayout'

export default function AppLayout() {
  return (
    <AppLayoutComponent>
      <Outlet />
    </AppLayoutComponent>
  )
}
