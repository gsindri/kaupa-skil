import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** ─────────────────────────────────────────────────────────────────────────────
 * Forgot password page with top banner (logo left / auth links right)
 * Vertical card (narrower) + same input/button style as login
 * ────────────────────────────────────────────────────────────────────────────*/
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setIsSuccess(true);
      setCooldown(30);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const friendly =
        /over_email_send_rate_limit/i.test(msg)
          ? "Too many reset emails sent. Please wait a few minutes and try again."
          : /invalid/i.test(msg) && /email/i.test(msg)
          ? "That email doesn’t look valid."
          : msg;

      toast({
        variant: "destructive",
        title: "Couldn’t send reset email",
        description: friendly,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TopBanner />

      {/* pt-20 = room for fixed banner; vertical, airy layout */}
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="mx-auto max-w-sm px-4">
          <div className="w-full rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <header className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                <Lock className="h-7 w-7 text-slate-600" />
              </div>
              <h1 className="mt-3 text-lg font-semibold text-gray-900">Trouble logging in?</h1>
              <p className="mt-1 text-sm text-gray-600">
                Enter the email you used to join and we’ll send instructions to reset your password.
              </p>
            </header>

            {!isSuccess ? (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-invalid={!emailValid && email.length > 0}
                    className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !emailValid || cooldown > 0}
                  className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading
                    ? "Sending…"
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Send reset link"}
                </button>

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-slate-500">or</span>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-600">
                  Create a new account{" "}
                  <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </p>

                <button
                  type="button"
                  onClick={() => (window.location.href = "/login")}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to login
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    We’ve sent a password reset link to <span className="font-medium">{email}</span>. Check your inbox
                    (and spam folder).
                  </AlertDescription>
                </Alert>

                <button
                  type="button"
                  className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                  onClick={() => (window.location.href = "/login")}
                >
                  Go to login
                </button>

                <p className="text-center text-sm text-gray-600">
                  Didn’t get an email?{" "}
                  <button
                    className="font-medium text-blue-600 hover:underline"
                    onClick={() => {
                      setIsSuccess(false);
                      setCooldown(0);
                      setTimeout(() => emailInputRef.current?.focus(), 0);
                    }}
                  >
                    Try another address
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/** Top banner: logo left, auth links right (fixed, translucent) */
function TopBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Wordmark */}
        <div className="flex items-center">
          <HeildaLogo className="h-6 -ml-px" />
        </div>

        {/* Auth actions */}
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

/** Heilda wordmark SVG (same as login), exposed as a component for reuse */
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
      {/* subtle boosted i-dot */}
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
