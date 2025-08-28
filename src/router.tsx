
import { createBrowserRouter, Outlet } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout } from "@/components/layout/AppLayout";
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
import CatalogPage from "@/pages/catalog/CatalogPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import ErrorPage from "@/pages/ErrorPage";
import NotFound from "@/pages/NotFound";
import { ExistingUserOnboarding } from "@/components/onboarding/ExistingUserOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const routes = [
  {
    path: "/",
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
        index: true,
        element: <Dashboard />,
      },
      {
        path: "cart",
        element: <Orders />,
      },
      {
        path: "compare",
        element: <Compare />,
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
        path: "price-history",
        element: <PriceHistory />,
      },
      {
        path: "discovery",
        element: <Discovery />,
      },
      {
        path: "catalog",
        element: <CatalogPage />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "delivery",
        element: <Delivery />,
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
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/onboarding",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/create",
    element: (
      <AuthGate>
        <OnboardingWizard />
      </AuthGate>
    ),
  },
  {
    path: "/settings/organization/join",
    element: (
      <AuthGate>
        <ExistingUserOnboarding />
      </AuthGate>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});
