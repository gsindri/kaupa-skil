import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ResetPassword from "./ResetPassword";

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      auth: {
        exchangeCodeForSession: vi.fn(),
        signOut: vi.fn(),
        updateUser: vi.fn(),
      },
    },
  };
});
import { supabase } from "@/integrations/supabase/client";

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/reset-password?code=testcode");
  });

  it("shows error and signs out for invalid or reused links", async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({ error: new Error("bad link") });

    render(
      <MemoryRouter>
        <React.StrictMode>
          <ResetPassword />
        </React.StrictMode>
      </MemoryRouter>
    );

    await screen.findByText("This password reset link is invalid or has expired.");
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("renders the reset form for valid links", async () => {
    (supabase.auth.exchangeCodeForSession as any).mockResolvedValue({ error: null });

    render(
      <MemoryRouter>
        <React.StrictMode>
          <ResetPassword />
        </React.StrictMode>
      </MemoryRouter>
    );

    await waitFor(() => expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1));
    expect(screen.getByPlaceholderText("New password")).toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
