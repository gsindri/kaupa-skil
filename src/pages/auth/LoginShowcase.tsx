import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailConfirmation } from "@/components/auth/EmailConfirmation";

/** ─────────────────────────────────────────────────────────────────────────────
 *  Top-level page: guards + background + clean, simple card (BlueCart vibe)
 *  ───────────────────────────────────────────────────────────────────────────*/
export default function LoginShowcase() {
  const { user, loading, error, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (isInitialized && user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, isInitialized, navigate, location]);

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Checking your session…</p>
          {error && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{String(error)}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5 mt-[-16rem]">
        <BrandHeader />
        <div className="mt-5">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Auth form: password sign-in / sign-up (simple, no magic-link)
 *  Keeps: Forgot password, CapsLock hint, EmailConfirmation after signup.
 *  ───────────────────────────────────────────────────────────────────────────*/
function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  const { signIn, signUp } = useAuth();
  const isLogin = mode === "login";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      toast({ variant: "destructive", title: "Invalid email", description: "Please enter a valid email address." });
      return;
    }
    if (!isLogin && password.length < 6) {
      toast({ variant: "destructive", title: "Weak password", description: "Password must be at least 6 characters." });
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
        toast({ title: "Welcome back", description: "Signed in successfully." });
      } else {
        await signUp(email.trim(), password, fullName.trim());
        toast({ title: "Account created", description: "Please verify your email to continue.", duration: 5000 });
        setSignupEmail(email.trim());
        setShowEmailConfirmation(true);
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      let title = isLogin ? "Login failed" : "Signup failed";
      let detail =
        /Invalid login credentials/i.test(msg) ? "Invalid email or password."
        : /User already registered/i.test(msg) ? "An account with this email already exists. Try signing in."
        : /over_email_send_rate_limit/i.test(msg) ? "Too many emails sent. Please wait a few minutes."
        : /invalid/i.test(msg) && /email/i.test(msg) ? "Please enter a valid email address."
        : msg;
      toast({ variant: "destructive", title, description: detail });
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setPassword("");
  };

  const handleBackToSignup = () => {
    setShowEmailConfirmation(false);
    setSignupEmail("");
  };

  if (showEmailConfirmation) {
    return <EmailConfirmation email={signupEmail} onBack={handleBackToSignup} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Full name (signup only) */}
      {!isLogin && (
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm text-gray-700">Full name</label>
          <input
            id="fullName"
            type="text"
            required
            disabled={busy}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            placeholder="Your name"
          />
        </div>
      )}

      {/* Email */}
      <div>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          disabled={busy}
          aria-invalid={!emailValid && email.length > 0}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          placeholder="Email"
        />
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            disabled={busy}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
            onKeyUp={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            placeholder="Password"
            minLength={!isLogin ? 6 : undefined}
          />
          <button
            type="button"
            aria-label={showPwd ? "Hide password" : "Show password"}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            disabled={busy}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {isLogin && (
          <a href="/reset-password" className="mt-1 inline-block text-xs text-blue-600 hover:underline">Forgot password?</a>
        )}
        {caps && <p className="mt-1 text-xs text-amber-600">Caps Lock is on.</p>}
        {!isLogin && <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters.</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="mt-1 w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
      >
        {busy ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign In" : "Create account")}
      </button>

      {/* Signup helper notice */}
      {!isLogin && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            After creating your account, we’ll email a confirmation link. Check your inbox (and spam).
          </AlertDescription>
        </Alert>
      )}

      {/* Switch mode link */}
      <p className="text-center text-sm text-gray-600">
        {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
        <button type="button" onClick={toggleMode} className="font-medium text-blue-600 hover:underline">
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Brand header — uses your logo from /public/logo.svg
 *  ───────────────────────────────────────────────────────────────────────────*/
function BrandHeader() {
  return (
    <header className="mb-5">
      {/* h-[26→30] scales nicely; -ml-px aligns the arc with input borders */}
      <svg
        className="block h-[30px] md:h-[32px] lg:h-[34px] w-auto -ml-px"
        viewBox="0 0 320 64"
        role="img"
        aria-label="Heilda"
      >
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

        {/* Arc tucked in */}
        <path
          d="M25,34 A16,16 0 0 1 41,20"
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Wordmark – light enough for full legibility */}
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
        </defs>
      </svg>
    </header>
  );
}
