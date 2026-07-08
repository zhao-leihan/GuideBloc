"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-28 pb-16 text-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200')] bg-cover bg-center opacity-5" />
          <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 border border-primary-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white">
              Terms of Service
            </h1>
            <p className="text-dark-300 text-sm max-w-xl mx-auto leading-relaxed">
              Last updated: July 7, 2026. Please read our service agreement terms carefully.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="card p-8 md:p-12 space-y-6 text-sm text-dark-700 leading-relaxed">
            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Explomate.ly (the &quot;Platform&quot;), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              2. User Accounts & Vetting
            </h2>
            <p>
              Users register as either Tourists or Tour Guides. Tour Guides are subject to verification check processes, but Explomate does not guarantee the behavior or safety of users. You are responsible for keeping your account credentials confidential.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              3. Escrow Payments & Fees
            </h2>
            <p>
              Explomate uses Web3 smart contracts to hold bookings payments in escrow. A 10% platform commission is automatically deducted from guide payouts upon booking completion. Refund terms are detailed in our Cancellation Policy.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              4. Prohibited Actions
            </h2>
            <p>
              Users may not request offline cash/crypto transactions, bypass platform fees, submit fraudulent identity verification documents, or post abusive/unsafe content on listings.
            </p>

            <h2 className="text-lg font-bold text-dark-900 font-display border-b border-dark-100 pb-2 pt-4">
              5. Dispute Resolution
            </h2>
            <p>
              Disputed escrow releases are arbitrated by Explomate&apos;s administration panel, whose decision is final and binding on both guides and tourists.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
