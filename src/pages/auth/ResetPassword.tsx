import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error) throw error;
      } catch (err: any) {
        setPageError("This password reset link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    }
    getSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "Password updated", description: "Please sign in with your new password." });
      navigate("/login");
    } catch (err: any) {
      setFormError(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <TopBanner />
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="mx-auto max-w-sm px-4">
          <div className="w-full rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <header className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                <Lock className="h-7 w-7 text-slate-600" />
              </div>
              <h1 className="mt-3 text-lg font-semibold text-gray-900">Reset your password</h1>
              <p className="mt-1 text-sm text-gray-600">Enter a new password for your account.</p>
            </header>

            {pageError ? (
              <div className="mt-6 space-y-4">
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{pageError}</AlertDescription>
                </Alert>
                <button
                  type="button"
                  className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                  onClick={() => navigate("/forgot-password")}
                >
                  Send a new reset link
                </button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="password" className="sr-only">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="New password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="sr-only">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Confirm password"
                  />
                </div>

                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{formError}</AlertDescription>
                  </Alert>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {busy ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function TopBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center">
          <HeildaLogo className="h-6 -ml-px" />
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeildaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 64" role="img" aria-label="Heilda">
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C7793B" />
          <stop offset="1" stopColor="#F6B044" />
        </linearGradient>
        <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5F7597" />
          <stop offset="1" stopColor="#D18A3A" />
        </linearGradient>
      </defs>
      <path d="M25,34 A16,16 0 0 1 41,20" fill="none" stroke="url(#arcGrad)" strokeWidth="5" strokeLinecap="round" />
      <text
        x="46"
        y="42"
        fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="500"
        fontSize="30"
        letterSpacing=".02em"
        fill="url(#textGrad)"
        stroke="#0B1220"
        strokeWidth=".22"
        strokeOpacity=".10"
        style={{ paintOrder: "stroke fill", strokeLinejoin: "round" }}
      >
        Heilda
      </text>
      <defs>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#softGlow)">
        <circle cx="84.6" cy="14.1" r="2.0" fill="#F6B044" opacity="0.85" />
      </g>
      <circle cx="84.6" cy="14.1" r="2.6" fill="none" stroke="url(#arcGrad)" strokeWidth="1.1" opacity="0.9" />
    </svg>
  );
}
