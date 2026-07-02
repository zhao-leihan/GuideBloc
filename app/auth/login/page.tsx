"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuide = searchParams.get("role") === "guide";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      try {
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          const roleRes = await fetch(`/api/auth/user-role?email=${encodeURIComponent(email)}`);
          if (roleRes.ok) {
            const { role } = await roleRes.json();
            if (role === "ADMIN") {
              router.push("/admin/dashboard");
            } else if (role === "GUIDE") {
              router.push("/dashboard/guide/overview");
            } else {
              router.push("/");
            }
          } else {
            router.push("/");
          }
        }
      } catch {
        router.push("/");
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            {/* Elegant Tab Switcher for Tourist vs Guide Login */}
            <div className="flex bg-dark-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  router.push("/auth/login");
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isGuide ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-700"
                }`}
              >
                Tourist Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/auth/login?role=guide");
                }}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isGuide ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-700"
                }`}
              >
                Tour Guide Sign In
              </button>
            </div>

            <div className="text-center mb-8">
              <img src="/assets/logo.png" alt="explomate Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-dark-900">
                {isGuide ? "Guide Sign In" : "Welcome back"}
              </h1>
              <p className="text-dark-500 mt-2">
                {isGuide ? "Sign in to your guide dashboard" : "Sign in to your explomate account"}
              </p>
            </div>
            {/* Google Login */}
            <button
              onClick={() => signIn("google", { callbackUrl: searchParams.get("callbackUrl") || "/" })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-dark-200 hover:bg-dark-50 transition-colors mb-6 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-dark-700">Continue with Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-dark-400">or sign in with email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-dark-300" />
                  <span className="text-sm text-dark-600">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : isGuide ? "Sign In as Guide" : "Sign In"}
              </button>
            </form>
          </div>

          {isGuide ? (
            <p className="text-center text-sm text-dark-500 mt-6">
              Want to become a guide?{" "}
              <Link href="/freelancer" className="text-primary font-medium hover:underline">
                Apply here
              </Link>
            </p>
          ) : (
            <p className="text-center text-sm text-dark-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
