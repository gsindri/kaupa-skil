import React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, RouterProvider, Outlet, useLocation } from "react-router-dom"

import { OnboardingWizard } from "./OnboardingWizard"
import { TooltipProvider } from "@/components/ui/tooltip"

const mockToast = vi.fn()
const mockRefetch = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast })
}))

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { tenant_id: null },
    profileLoading: false,
    refetch: mockRefetch
  })
}))

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "suppliers") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        }
      }

      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "tenant-123", name: "Test Org", created_by: "user-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "profiles") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        }
      }

      if (table === "supplier_connections") {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null })
        }
      }

      return {}
    })
  }
}))

import { supabase } from "@/integrations/supabase/client"
const supabaseMock = supabase as unknown as { from: ReturnType<typeof vi.fn> }

const ObserverLayout = ({ onChange }: { onChange: (path: string) => void }) => {
  const location = useLocation()

  React.useEffect(() => {
    onChange(`${location.pathname}${location.search}${location.hash}`)
  }, [location, onChange])

  return <Outlet />
}

describe("OnboardingWizard completion navigation", () => {
  let queryClient: QueryClient
  let observedPath = ""

  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetch.mockResolvedValue(undefined)
    localStorage.clear()
    observedPath = ""
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  })

  afterEach(() => {
    supabaseMock.from.mockClear()
    queryClient.clear()
  })

  it("returns to the originating path after finishing setup", async () => {
    localStorage.setItem(
      "workspace_setup_draft",
      JSON.stringify({
        organization: { name: "Test Org" },
        selectedSupplierIds: [],
        currentStep: 3,
        preferences: { language: "is-IS", currency: "ISK" }
      })
    )

    const user = userEvent.setup()

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: (
            <TooltipProvider>
              <ObserverLayout onChange={path => { observedPath = path }} />
            </TooltipProvider>
          ),
          children: [
            {
              path: "/onboarding",
              element: <OnboardingWizard />
            },
            {
              path: "/dashboard",
              element: <div>Dashboard</div>
            }
          ]
        }
      ],
      {
        initialEntries: [{ pathname: "/onboarding", state: { from: "/dashboard" } }]
      }
    )

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    const finishButton = await screen.findByRole("button", { name: /finish setup/i })

    await user.click(finishButton)

    await waitFor(() => {
      expect(observedPath).toBe("/dashboard")
    })
  })
})
