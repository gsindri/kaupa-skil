
import { createBrowserRouter } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";
import Orders from "@/pages/Orders";
import Suppliers from "@/pages/Suppliers";
import Pantry from "@/pages/Pantry";
import Settings from "@/pages/Settings";
import PriceHistory from "@/pages/PriceHistory";
import Delivery from "@/pages/Delivery";
import Admin from "@/pages/Admin";
import Discovery from "@/pages/Discovery";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import PasswordReset from "@/pages/auth/PasswordReset";
import ErrorPage from "@/pages/ErrorPage";
import NotFound from "@/pages/NotFound";
import { Outlet } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGate>
        <Index />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/app",
    element: (
      <AuthGate>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "compare",
        element: <Compare />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "suppliers",
        element: <Suppliers />,
      },
      {
        path: "pantry",
        element: <Pantry />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "price-history",
        element: <PriceHistory />,
      },
      {
        path: "delivery",
        element: <Delivery />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "discovery",
        element: <Discovery />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup", 
    element: <SignupPage />,
  },
  {
    path: "/reset-password",
    element: <PasswordReset />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
