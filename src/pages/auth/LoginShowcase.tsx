import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailConfirmation } from "@/components/auth/EmailConfirmation";

/** ─────────────────────────────────────────────────────────────────────────────
 *  Top-level page: guards + background + card shell
 *  ───────────────────────────────────────────────────────────────────────────*/
export default function LoginShowcase() {
  const { user, profile, loading, error, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users to where they came from (or home)
  useEffect(() => {
    if (isInitialized && user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, profile, isInitialized, navigate, location]);

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking your session…</p>
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
    <main
      className="relative flex min-h-screen items-center justify-center"
      style={{
        background:
          "radial-gradient(1200px 800px at 20% -10%, rgba(37,99,235,0.15), transparent 60%), radial-gradient(1200px 800px at 120% 110%, rgba(16,185,129,0.12), transparent 60%), linear-gradient(180deg, #eef2ff, #f8fafc)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl">
        <BrandHeader />
        <div className="mt-6">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Auth form: password sign-in / sign-up + optional Email Link (OTP)
 *  ───────────────────────────────────────────────────────────────────────────*/
function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [flow, setFlow] = useState<"password" | "magic">("password"); // internal key can stay "magic"
  const [showPwd, setShowPwd] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  const auth = useAuth() as any;
  const { signIn, signUp } = auth;
  // Optional: your AuthProvider may expose this; we degrade gracefully if not.
  const signInWithOtp = auth?.signInWithOtp as undefined | ((email: string) => Promise<void>);

  const isLogin = mode === "login";
  const usingPassword = flow === "password";

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = isLogin || password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailValid) {
      toast({ variant: "destructive", title: "Invalid email", description: "Please enter a valid email address." });
      return;
    }
    if (usingPassword && !passwordValid) {
      toast({ variant: "destructive", title: "Weak password", description: "Password must be at least 6 characters." });
      return;
    }

    setBusy(true);
    try {
      if (!usingPassword) {
        // EMAIL LINK (OTP) FLOW
        if (typeof signInWithOtp === "function") {
          await signInWithOtp(email);
          toast({
            title: "Email link sent",
            description: "Check your inbox to finish signing in.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Email link not configured",
            description: "Expose signInWithOtp(email) in AuthProvider to enable this.",
          });
        }
        return;
      }

      // PASSWORD FLOW
      if (isLogin) {
        await signIn(email, password);
        toast({ title: "Welcome back", description: "Signed in successfully." });
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Account created",
          description: "Please verify your email to continue.",
          duration: 5000,
        });
        setSignupEmail(email);
        setShowEmailConfirmation(true);
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      let title = isLogin ? "Login failed" : "Signup failed";
      let detail = "Something went wrong. Please try again.";

      if (/Invalid login credentials/i.test(msg)) detail = "Invalid email or password.";
      else if (/User already registered/i.test(msg)) detail = "An account with this email already exists. Try signing in.";
      else if (/over_email_send_rate_limit/i.test(msg)) detail = "Too many emails sent. Please wait a few minutes.";
      else if (/email/i.test(msg) && /invalid/i.test(msg)) detail = "Please enter a valid email address.";
      else detail = msg;

      toast({ variant: "destructive", title, description: detail });
    } finally {
      setBusy(false);
    }
  };

  const handleCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setFlow("password");
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
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      {/* Mode + Flow selectors */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-3 py-1.5 text-sm rounded-md ${isLogin ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
            aria-pressed={isLogin}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`px-3 py-1.5 text-sm rounded-md ${!isLogin ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
            aria-pressed={!isLogin}
          >
            Create account
          </button>
        </div>

        <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setFlow("password")}
            className={`px-2.5 py-1.5 text-xs rounded-md ${usingPassword ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
            aria-pressed={usingPassword}
            title="Use email + password"
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setFlow("magic")}
            className={`px-2.5 py-1.5 text-xs rounded-md ${!usingPassword ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
            aria-pressed={!usingPassword}
            title="Send a sign-in link to your email"
          >
            Email link
          </button>
        </div>
      </div>

      {/* Full name (signup only) */}
      {!isLogin && (
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            disabled={busy}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full rounded-xl border border-input bg-white px-3 py-2.5 text-foreground shadow-xs outline-none focus:ring-4 focus:ring-primary/20"
            placeholder="Your full name"
          />
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={busy}
          aria-invalid={!emailValid && email.length > 0}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-xl border border-input bg-white px-3 py-2.5 text-foreground shadow-xs outline-none focus:ring-4 focus:ring-primary/20"
          placeholder="you@company.is"
        />
      </div>

      {/* Password (password flow only) */}
      {usingPassword && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            {isLogin && (
              <a href="/reset-password" className="text-xs font-medium text-primary hover:underline">
                Forgot?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              disabled={busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
              onKeyUp={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
              minLength={!isLogin ? 6 : undefined}
              className="block w-full rounded-xl border border-input bg-white px-3 py-2.5 pr-10 text-foreground shadow-xs outline-none focus:ring-4 focus:ring-primary/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
              disabled={busy}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {caps && <p className="text-xs text-amber-600">Caps Lock is on.</p>}
          {!isLogin && <p className="text-xs text-muted-foreground">Password must be at least 6 characters.</p>}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:opacity-95 focus-visible:ring-4 focus-visible:ring-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
            {isLogin ? (usingPassword ? "Signing in…" : "Sending email link…") : "Creating account…"}
          </>
        ) : (
          <>{isLogin ? (usingPassword ? "Sign in" : "Send email link") : "Create account"}</>
        )}
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

      {/* Switch mode */}
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button type="button" onClick={toggleMode} className="font-medium text-primary hover:underline">
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
    <div className="text-center">
      <img
        src="/logo.svg"
        alt="Iceland B2B Wholesale"
        className="mx-auto h-10 w-auto rounded-xl shadow-sm"
        draggable={false}
      />
      <p className="mt-2 text-xs text-muted-foreground">Sign in to your account</p>
    </div>
  );
}
