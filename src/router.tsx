
import { createBrowserRouter } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import AppLayout from "@/components/layout/AppLayout";
import { ExistingUserOnboarding } from "@/components/onboarding/ExistingUserOnboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import Admin from "@/pages/Admin";
import CatalogPage from "@/pages/catalog/CatalogPage";
import Checkout from "@/pages/Checkout";
import Compare from "@/pages/Compare";
import Dashboard from "@/pages/Dashboard";
import Delivery from "@/pages/Delivery";
import Discovery from "@/pages/Discovery";
import ErrorPage from "@/pages/ErrorPage";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import LoginPage from "@/pages/auth/LoginPage";
import NotFound from "@/pages/NotFound";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Orders from "@/pages/Orders";
import Pantry from "@/pages/Pantry";
import PriceHistory from "@/pages/PriceHistory";
import ResetPassword from "@/pages/auth/ResetPassword";
import Settings from "@/pages/Settings";
import SignupPage from "@/pages/auth/SignupPage";
import Suppliers from "@/pages/Suppliers";

export const routes = [
  {
    path: "/",
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "checkout",
        element: <Checkout />,
      },
      {
        path: "checkout/confirmation",
        element: <OrderConfirmation />,
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
    path: "/catalog",
    element: (
      <AuthGate>
        <CatalogPage />
      </AuthGate>
    ),
    errorElement: <ErrorPage />,
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
