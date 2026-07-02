"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, MapPin } from "lucide-react";
import { GlobeIcon, Crosshair2Icon } from "@radix-ui/react-icons";
import Navbar from "@/components/layout/Navbar";
import toast from "react-hot-toast";
import { COUNTRIES } from "@/lib/countries";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "guide" ? "GUIDE" : "TOURIST";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
    country: "",
    certificationText: "",
    certificationFile: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          country: form.country,
          certificationText: form.role === "GUIDE" ? form.certificationText : undefined,
          certificationFile: form.role === "GUIDE" ? form.certificationFile : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please sign in.");
      router.push("/auth/login");
    } catch {
      toast.error("Something went wrong");
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
              <img src="/assets/logo.png" alt="explomate Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-dark-900">
                {form.role === "GUIDE" ? "Register as a Tour Guide" : "Create your account"}
              </h1>
              <p className="text-dark-500 mt-2">
                {form.role === "GUIDE" ? "Join explomate as a local expert" : "Join the explomate community"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="input pl-10"
                    required
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.role === "GUIDE" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1.5">
                      Certification & Experience Details
                    </label>
                    <div className="relative">
                      <textarea
                        value={form.certificationText}
                        onChange={(e) => setForm({ ...form, certificationText: e.target.value })}
                        className="input pl-3 pr-3 py-2 min-h-[100px] w-full border border-dark-200 rounded-xl outline-none"
                        placeholder="Write your guide license number, experience details, or certificates..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1.5 font-semibold">
                      Upload Certification File (PDF, JPG, PNG - Max 5MB) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File is too large! Maximum size is 5MB.");
                            e.target.value = "";
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm({ ...form, certificationFile: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-dark-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input pl-10 pr-10"
                    placeholder="Min 8 characters"
                    minLength={8}
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

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="input pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-xs text-dark-400 mt-4 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <p className="text-center text-sm text-dark-500 mt-6">
            Already have an account?{" "}
            <Link href={form.role === "GUIDE" ? "/auth/login?role=guide" : "/auth/login"} className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
