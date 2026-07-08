"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, ShieldAlert, Award, FileCheck, CheckCircle, HelpCircle } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero banner */}
        <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-28 pb-16 text-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200')] bg-cover bg-center opacity-5" />
          <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 border border-primary-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white">
              Trust & Safety
            </h1>
            <p className="text-dark-300 text-sm max-w-xl mx-auto leading-relaxed">
              We design every feature of Explomate to protect our tourist community and vetted local guides. Discover our safety pillars.
            </p>
          </div>
        </section>

        {/* Safety Pillars */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "1. Vetted Tour Guides",
                desc: "Every guide on Explomate goes through a mandatory verification process including ID/passport checks, profile vetting, and rating-based quality checks before they can list tours.",
                icon: FileCheck,
                color: "text-primary bg-primary/10",
              },
              {
                title: "2. Escrow Smart Contracts",
                desc: "Payments are held locked in a decentralized Web3 escrow smart contract. Funds are only released to the guide after the tour is completed, completely eliminating pre-payment scams.",
                icon: Award,
                color: "text-secondary bg-secondary/10",
              },
              {
                title: "3. Dispute Resolution Center",
                desc: "If anything goes wrong during a booking, the tourist or guide can dispute the booking. Explomate's admin panel acts as an impartial arbiter to resolve disputes fairly.",
                icon: ShieldAlert,
                color: "text-accent bg-accent/10",
              },
            ].map((pillar, idx) => (
              <div key={idx} className="card p-8 hover:border-primary/20 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${pillar.color}`}>
                  <pillar.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-dark-900 text-lg mb-3">
                  {pillar.title}
                </h3>
                <p className="text-dark-600 text-xs leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guidelines section */}
        <section className="bg-white border-t border-b border-dark-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* For Tourists */}
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-dark-900 border-b border-dark-100 pb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" /> Safety Tips for Tourists
                </h3>
                <ul className="space-y-4 text-xs text-dark-600 leading-relaxed list-disc list-inside">
                  <li>Keep all chat communications inside Explomate&apos;s secure chat box.</li>
                  <li>Verify the tour details, duration, meeting points, and included services before booking.</li>
                  <li>Do not agree to pay cash or send cryptocurrency directly to the guide offline. All payments must go through the escrow checkout.</li>
                  <li>In case of anomalies or problems during the tour, click &quot;Dispute&quot; immediately to hold the funds.</li>
                </ul>
              </div>

              {/* For Guides */}
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-dark-900 border-b border-dark-100 pb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary" /> Guidelines for Tour Guides
                </h3>
                <ul className="space-y-4 text-xs text-dark-600 leading-relaxed list-disc list-inside">
                  <li>Be truthful about your listings, prices, languages spoken, and safety equipment.</li>
                  <li>Always upload ID verification card/passport and certifications to maintain approved status.</li>
                  <li>Deliver quality service to earn excellent reviews, level up, and unlock more guide benefits.</li>
                  <li>Never ask a tourist for offline payments. Any violation of escrow rules results in account termination.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
