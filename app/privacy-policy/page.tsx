"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-28 pb-16 text-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=1200')] bg-cover bg-center opacity-5" />
          <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 border border-primary-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white">
              Privacy Policy
            </h1>
            <p className="text-dark-300 text-sm max-w-xl mx-auto leading-relaxed">
              Last updated: July 7, 2026. How we collect, secure, and handle your personal details.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="card p-8 md:p-12 space-y-6 text-sm text-dark-700 leading-relaxed">
            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2">
              1. Information We Collect
            </h2>
            <p>
              We collect personal data such as your name, email address, password hashes, cryptographically public wallet address, passport/ID numbers (for verification), and profiles.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              2. How We Use Information
            </h2>
            <p>
              Your personal data is used to secure escrow bookings, verify identity integrity, facilitate chats, send automated transaction receipts via email, and update system leaderboards.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              3. Data Security & Storage
            </h2>
            <p>
              All confidential fields (like passwords) are cryptographically hashed using BCrypt. ID numbers and passport scans are stored securely to satisfy our Know-Your-Customer (KYC) requirements. Public transaction references (like Tx Hashes) are preserved transparently on public blockchain networks.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              4. Cookies & Trackers
            </h2>
            <p>
              We use functional session cookies (via NextAuth) to keep you logged in to your account. Detailed cookie usage guidelines are explained in our Cookie Policy.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
