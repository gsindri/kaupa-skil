
import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Building2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const PRIMARY = {
  bg: "#0b1220",
  tint: "#101826", 
  brand: "#2563eb",
  brandSoft: "#dbeafe",
};

export default function LoginShowcase() {
  const [mode, setMode] = useState<"card" | "split" | "glass">("card");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with soft radial accents */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px 600px at -10% -10%, rgba(37, 99, 235, 0.10), transparent 60%), radial-gradient(900px 600px at 110% 110%, rgba(16, 185, 129, 0.10), transparent 60%), linear-gradient(0deg, #f8fafc, #f8fafc)",
        }}
      />

      {/* Top controls */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-black/5 bg-white/80 p-1 shadow-sm backdrop-blur">
        {[
          { k: "card", label: "Card" },
          { k: "split", label: "Split" },
          { k: "glass", label: "Glass" },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => setMode(o.k as any)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              mode === (o.k as any)
                ? "bg-black/80 text-white"
                : "hover:bg-black/5 text-gray-700"
            }`}
            aria-pressed={mode === (o.k as any)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {mode === "card" && <CenteredCard />}
      {mode === "split" && <SplitLayout />}
      {mode === "glass" && <GlassLayout />}
    </div>
  );
}

function AuthForm({ compact = false }: { compact?: boolean }) {
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
    <form onSubmit={handleSubmit} className={`w-full ${compact ? "space-y-4" : "space-y-6"}`}>
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
            <a href="/reset" className="text-xs font-medium text-blue-600 hover:underline">
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

function CenteredCard() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-xl">
        <BrandHeader />
        <div className="mt-6">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

function SplitLayout() {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left marketing panel */}
      <div className="relative hidden overflow-hidden md:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(1200px 600px at 10% 0%, ${PRIMARY.brandSoft}, transparent 60%), linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%)`,
          }}
        />
        <div className="relative h-full p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur">
            <Check className="h-3.5 w-3.5" /> Iceland B2B Wholesale
          </div>
          <h2 className="mt-6 max-w-md text-3xl font-semibold tracking-tight text-gray-900">
            Compare Icelandic wholesale prices with <span className="text-blue-700">clarity</span>.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            {[
              "Secure supplier login & VAT-ready invoices",
              "Unit-aware price comparisons (ISK)",
              "Email orders with a single click",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/10 text-blue-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-8 left-12 right-12 h-40 rounded-2xl border border-blue-200 bg-white/70 p-4 shadow-lg backdrop-blur">
            <p className="text-sm text-gray-700">
              "The simplest way to keep our food costs down. The VAT toggle is a lifesaver."
            </p>
            <p className="mt-2 text-xs text-gray-500">— Reykjavík Café Collective</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <BrandHeader align="left" />
          <div className="mt-6">
            <AuthForm />
          </div>
        </div>
      </div>
    </main>
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

function BrandHeader({ align = "center" as "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div className={`mx-auto inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 ${align === "center" ? "" : ""}`}>
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
