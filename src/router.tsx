
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import Orders from '@/pages/Orders'
import Compare from '@/pages/Compare'
import Suppliers from '@/pages/Suppliers'
import Settings from '@/pages/Settings'
import Admin from '@/pages/Admin'
import Delivery from '@/pages/Delivery'
import Discovery from '@/pages/Discovery'
import Pantry from '@/pages/Pantry'
import PriceHistory from '@/pages/PriceHistory'
import NotFound from '@/pages/NotFound'
import ErrorPage from '@/pages/ErrorPage'
import LoginShowcase from '@/pages/auth/LoginShowcase'
import PasswordReset from '@/pages/auth/PasswordReset'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginShowcase />,
    errorElement: <ErrorPage />
  },
  {
    path: '/reset-password',
    element: <PasswordReset />,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'compare',
        element: <Compare />
      },
      {
        path: 'suppliers',
        element: <Suppliers />
      },
      {
        path: 'delivery',
        element: <Delivery />
      },
      {
        path: 'discovery',
        element: <Discovery />
      },
      {
        path: 'pantry',
        element: <Pantry />
      },
      {
        path: 'price-history',
        element: <PriceHistory />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'admin',
        element: <Admin />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
])
