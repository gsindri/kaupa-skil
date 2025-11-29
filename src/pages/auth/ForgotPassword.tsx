import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HeildaLogo } from "@/components/branding/HeildaLogo";

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
  const navigate = useNavigate();

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

      <main className="min-h-screen grid place-items-center bg-slate-50 pt-20">
        <div className="w-full max-w-md mt-[-8rem] px-4">
          <div className="rounded-2xl p-px bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg">
            <div className="rounded-2xl bg-white p-8">
              <header className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                  <Lock className="h-7 w-7 text-slate-600" />
                </div>
                <h1 className="mt-6 text-lg font-semibold text-gray-900">Trouble logging in?</h1>
                <span className="mt-2 block h-[2px] w-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 mx-auto" />
                <p className="mt-4 text-sm text-gray-600">
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
                      className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-120 ease-in-out focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      placeholder="Email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !emailValid || cooldown > 0}
                    className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-120 ease-in-out hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
                    <Link to="/signup" className="font-medium text-brand-600 hover:underline">
                      Sign up
                    </Link>
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-2 w-full rounded-full border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
                    className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-120 ease-in-out hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    onClick={() => navigate("/login")}
                  >
                    Go to login
                  </button>

                  <p className="text-center text-sm text-gray-600">
                    Didn’t get an email?{" "}
                    <button
                      className="font-medium text-brand-600 hover:underline"
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
          <Link to="/">
            <HeildaLogo className="h-6 -ml-px" variant="dark" />
          </Link>
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
