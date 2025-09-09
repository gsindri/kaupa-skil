
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [caps, setCaps] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [formError, setFormError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const [errorType, setErrorType] = useState<"existing" | "unconfirmed" | "">("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trimmedEmail = email.trim();
  const trimmedFullName = fullName.trim();
  const isFormValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) &&
    password.length >= (isLogin ? 1 : 6) &&
    (isLogin || trimmedFullName.length > 0) &&
    !emailError &&
    !passwordError &&
    (isLogin || !fullNameError);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setFullNameError("");
    setFormError("");

    const emailTrimmed = email.trim();
    const fullNameTrimmed = fullName.trim();
    let hasError = false;

    if (!emailTrimmed) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (!isLogin && password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    }

    if (!isLogin && !fullNameTrimmed) {
      setFullNameError("Full name is required.");
      hasError = true;
    }

    if (hasError) {
      setFormError("Please fix the errors below.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    console.log('Form submission started, mode:', mode)
    setBusy(true);

    try {
      if (isLogin) {
        console.log('Starting log in process...')
        await signIn(emailTrimmed, password, remember);
        console.log('Log in completed successfully')
        toast({ title: "Welcome back", description: "Logged in successfully." });
        
      } else {
        console.log('Starting sign up process...')
        await signUp(emailTrimmed, password, fullNameTrimmed);
        setShowConfirm(true);
        toast({ title: "Account created", description: "Check your email to verify.", duration: 5000 });
      }
    } catch (err: any) {
      console.error('Auth form error:', err);
      const msg = String(err?.message || err);

      if (isLogin) {
        const code = err?.code;
        const status = err?.status;

        if (code === 'invalid_credentials' || status === 400) {
          setFormError('Email or password is incorrect.');
        } else if (
          code === 'email_not_confirmed' ||
          status === 403 ||
          msg.toLowerCase().includes('confirm')
        ) {
          setErrorType('unconfirmed');
        } else if (code === 'over_rate_limit' || status === 429) {
          setFormError('Too many attempts. Please try again later.');
        } else if (!status || status >= 500) {
          setFormError("We couldn't reach the server. Please try again.");
        } else {
          setFormError(msg);
        }
        requestAnimationFrame(() => errorRef.current?.focus());
      } else {
        const status = err?.status;
        if (status === 400 || msg.toLowerCase().includes('already registered')) {
          setErrorType('existing');
        } else if (msg.toLowerCase().includes('confirm') || status === 403) {
          setErrorType('unconfirmed');
        } else {
          setFormError(msg);
          requestAnimationFrame(() => errorRef.current?.focus());
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      toast({ title: "Email sent", description: "Activation email resent." });
      setResendCooldown(60);
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
      resendIntervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendIntervalRef.current) {
              clearInterval(resendIntervalRef.current);
              resendIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || String(err) });
    } finally {
      setResending(false);
    }
  }

  if (!isLogin && showConfirm) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            We’ve sent a confirmation email. Please check your inbox.
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === "existing") {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            An account with this email already exists.
          </AlertDescription>
        </Alert>
        <div className="flex justify-between text-sm">
          <Link to="/reset-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === "unconfirmed") {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            Your account isn’t activated yet.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {resending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend activation email"}
          </button>
        </div>
        <div className="text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {formError && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-md border border-error/20 bg-error/10 p-3 text-sm text-error"
        >
          {formError}
        </div>
      )}

      <div className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="fullName" className="sr-only">Full name</label>
            <input
              id="fullName"
              type="text"
              required
              disabled={busy}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!fullNameError}
              aria-describedby={fullNameError ? "fullName-error" : undefined}
              className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors duration-120 ease-in-out focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              placeholder="Full name"
            />
            {fullNameError && (
              <p id="fullName-error" className="mt-1 text-xs text-red-600">
                {fullNameError}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <label htmlFor="email" className="sr-only">Email</label>
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm outline-none transition-colors duration-120 ease-in-out focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            placeholder="Email"
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-xs text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              disabled={busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
              onKeyUp={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
              onFocus={(e) => setCaps((e as any).getModifierState?.("CapsLock"))}
              onBlur={() => setCaps(false)}
              minLength={!isLogin ? 6 : undefined}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              className="w-full rounded-full border border-slate-300 bg-white pl-10 pr-10 py-3 text-sm outline-none transition-colors duration-120 ease-in-out focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              placeholder="Password"
            />
            <button
              type="button"
              aria-label={showPwd ? "Hide password" : "Show password"}
              aria-pressed={showPwd}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg p-2 text-gray-500 transition-colors duration-120 ease-in-out hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              disabled={busy}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {!isLogin && (
            <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters.</p>
          )}
          {passwordError && (
            <p id="password-error" className="mt-1 text-xs text-red-600">
              {passwordError}
            </p>
          )}
          {caps && <p className="mt-1 text-xs text-amber-600">Caps Lock is on.</p>}
        </div>
      </div>

      {isLogin && (
        <Link
          to="/forgot-password"
          className="block text-right text-sm text-blue-600 transition-colors duration-120 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Forgot password?
        </Link>
      )}

      {isLogin && (
        <label htmlFor="remember" className="flex items-center gap-2 py-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={busy}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">Remember me</span>
        </label>
      )}

      <button
        type="submit"
        disabled={busy || !isFormValid}
        className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-120 ease-in-out hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isLogin ? "Logging in…" : "Creating account…"}
          </span>
        ) : (
          isLogin ? "Log In" : "Create account"
        )}
      </button>

      <p className="border-t border-slate-200 pt-4 text-center text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link
          to={isLogin ? "/signup" : "/login"}
          className="font-medium text-blue-600 transition-colors duration-120 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
