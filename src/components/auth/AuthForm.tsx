
import React, { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type AuthMode = "login" | "signup";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [caps, setCaps] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid) {
      toast({ variant: "destructive", title: "Invalid email", description: "Enter a valid email address." });
      return;
    }
    if (!isLogin && password.length < 6) {
      toast({ variant: "destructive", title: "Weak password", description: "Min 6 characters." });
      return;
    }
    
    console.log('Form submission started, mode:', mode)
    setBusy(true);
    
    try {
      if (isLogin) {
        console.log('Starting sign in process...')
        await signIn(email.trim(), password);
        console.log('Sign in completed successfully')
        toast({ title: "Welcome back", description: "Signed in successfully." });
        
        // Let AuthGate handle the redirect based on auth state
        // No manual navigation needed
      } else {
        console.log('Starting sign up process...')
        await signUp(email.trim(), password, fullName.trim());
        setShowConfirm(true);
        toast({ title: "Account created", description: "Check your email to verify.", duration: 5000 });
      }
    } catch (err: any) {
      console.error('Auth form error:', err)
      const msg = String(err?.message || err);
      const title = isLogin ? "Sign in failed" : "Sign up failed";
      const detail =
        /Invalid login credentials/i.test(msg) ? "Please check your email and password."
        : /User already registered/i.test(msg) ? "An account with this email already exists. Try signing in instead."
        : /over_email_send_rate_limit/i.test(msg) ? "Too many emails sent. Please wait a few minutes before trying again."
        : /invalid/i.test(msg) && /email/i.test(msg) ? "Please enter a valid email address."
        : "An error occurred. Please try again.";
      toast({ variant: "destructive", title, description: detail });
    } finally {
      setBusy(false);
    }
  }

  if (!isLogin && showConfirm) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription className="text-sm">
          We emailed a confirmation link to <span className="font-medium">{email}</span>. Check your inbox/spam.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            placeholder="Full name"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="sr-only">Email</label>
        <input
          id="email" 
          type="email" 
          autoComplete="email" 
          required 
          disabled={busy}
          aria-invalid={!emailValid && email.length > 0}
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          placeholder="Email"
        />
      </div>

      <div>
        <div className="relative">
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
            minLength={!isLogin ? 6 : undefined}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            placeholder="Password"
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

        {isLogin ? (
          <Link to="/reset-password" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
            Forgot password?
          </Link>
        ) : (
          <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters.</p>
        )}
        {caps && <p className="mt-1 text-xs text-amber-600">Caps Lock is on.</p>}
      </div>

      <button
        type="submit" 
        disabled={busy || (!emailValid)}
        className="w-full rounded-full bg-blue-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
      >
        {busy ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign In" : "Create account")}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link to={isLogin ? "/signup" : "/login"} className="font-medium text-blue-600 hover:underline">
          {isLogin ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
