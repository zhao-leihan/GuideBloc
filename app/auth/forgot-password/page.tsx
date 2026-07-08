"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import TurnstileCaptcha from "@/components/auth/TurnstileCaptcha";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError("Please complete the Turnstile captcha check.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to request password reset.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <img src="/assets/logo.png" alt="Explomate Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-dark-900">Forgot Password</h1>
              <p className="text-dark-500 mt-2 text-sm leading-relaxed">
                Enter your email address below, and we&apos;ll send you a link to reset your account password.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 text-danger text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-dark-900 text-lg">Reset Link Emailed</h3>
                  <p className="text-xs text-dark-500 leading-relaxed">
                    We have emailed a password reset link to <strong>{email}</strong>.
                    Please check your inbox (and spam folder) and follow the link to reset your password.
                  </p>
                </div>
                <Link href="/auth/login" className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 mt-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <TurnstileCaptcha onVerify={setCaptchaVerified} />
                </div>

                <button
                  type="submit"
                  disabled={loading || !captchaVerified}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="text-center pt-4 border-t border-dark-100 mt-6">
                  <Link href="/auth/login" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
