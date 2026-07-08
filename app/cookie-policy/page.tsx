"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-28 pb-16 text-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549241597-f095203c5541?w=1200')] bg-cover bg-center opacity-5" />
          <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 border border-primary-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white">
              Cookie Policy
            </h1>
            <p className="text-dark-300 text-sm max-w-xl mx-auto leading-relaxed">
              Last updated: July 7, 2026. How we use cookies to keep you safely logged in.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="card p-8 md:p-12 space-y-6 text-sm text-dark-700 leading-relaxed">
            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your browser to recognize your session when you navigate across different pages on our application.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              2. Essential Cookies
            </h2>
            <p>
              We use essential JWT cookies to manage your secure logged-in state. NextAuth stores a secure token inside your browser cookies, which is automatically verified on every backend API request to authenticate your identity. Without these cookies, the account dashboard cannot function.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              3. Preference Cookies
            </h2>
            <p>
              We use local storage cookies to remember your visual preferences, such as selected map views or chat box positioning, to optimize your experience.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              4. Disabling Cookies
            </h2>
            <p>
              You can block or disable cookies using your browser settings. However, doing so will immediately prevent you from logging in, booking tours, or using dashboard messaging.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
