import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginShowcase() {
  const { user, profile, loading, error, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (isInitialized && user) {
      if (profile && !profile.tenant_id) {
        navigate("/setup", { replace: true });
      } else {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    }
  }, [user, profile, isInitialized, navigate, location]);

  // Show loading while checking auth state
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with soft radial accents */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% -10%, rgba(37,99,235,0.15), transparent 60%), radial-gradient(1200px 800px at 120% 110%, rgba(16,185,129,0.12), transparent 60%), linear-gradient(180deg, #eef2ff, #f8fafc)",
        }}
      />

      <GlassLayout />
    </div>
  );
}

function AuthForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', error);
      }
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {!isLogin && (
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required={!isLogin}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-xs outline-none ring-0 transition focus:border-gray-300 focus:ring-4 focus:ring-blue-100"
            placeholder="Your full name"
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-xs outline-none ring-0 transition focus:border-gray-300 focus:ring-4 focus:ring-blue-100"
          placeholder="you@company.is"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-900">
            Password
          </label>
          {isLogin && (
            <a href="/reset-password" className="text-xs font-medium text-blue-600 hover:underline">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 pr-10 text-gray-900 shadow-xs outline-none ring-0 transition focus:border-gray-300 focus:ring-4 focus:ring-blue-100"
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showPwd ? "Hide password" : "Show password"}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20 disabled:opacity-50"
      >
        {isLoading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-xs text-gray-500">or</span>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-xs transition hover:bg-gray-50"
      >
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-4 w-4"
        >
          <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303C33.602,32.912,29.166,36,24,36c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
          />
          <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24,44c5.113,0,9.78-1.958,13.294-5.148l-6.142-5.197C29.055,35.091,26.671,36,24,36 c-5.139,0-9.484-3.108-11.292-7.462l-6.55,5.047C9.482,39.556,16.227,44,24,44z"
          />
          <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-1.089,2.912-3.275,5.243-6.009,6.655c0.002-0.001,0.003-0.001,0.005-0.002 l6.142,5.197C34.955,40.005,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="font-medium text-blue-600 hover:underline"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

function GlassLayout() {
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

function BrandHeader() {
  return (
    <div className="text-center">
      <div className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">Iceland B2B Wholesale</p>
          <p className="text-xs text-gray-600">Sign in to your account</p>
        </div>
      </div>
    </div>
  );
}
