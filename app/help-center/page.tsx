"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Compass, BookOpen, Shield, HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

const categories = [
  {
    title: "Booking & Trips",
    desc: "How to book tours, cancel trips, and communicate with guides.",
    icon: Compass,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Payments & Escrow",
    desc: "Understanding stablecoin escrow, Transak, and Alchemy Pay.",
    icon: BookOpen,
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "Trust & Safety",
    desc: "Guidelines, vetted guides, passport validation, and protections.",
    icon: Shield,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Account & Profiles",
    desc: "Managing your user roles, profiles, XP, and benefits.",
    icon: HelpCircle,
    color: "bg-purple-500/10 text-purple-500",
  },
];

const faqs = [
  {
    q: "How does the blockchain escrow payment system work?",
    a: "When you book a tour, your payment (USDC/USDT) is locked in a Web3 smart contract escrow. The funds are held safely until the tour is successfully completed. Only after your verification is confirmed are the funds released to the guide's wallet. This prevents typical tourism scams.",
  },
  {
    q: "What if my guide cancels the tour?",
    a: "If a guide cancels or fails to show up, the payment contract is automatically refunded to your registered tourist wallet address. You will receive 100% of your funds back.",
  },
  {
    q: "Are the tour guides verified?",
    a: "Yes. Every tour guide on Explomate must complete a verification process, including government-issued ID/passport checking, background screenings, and experience reviews before they are allowed to list tours on the platform.",
  },
  {
    q: "How do I pay if I do not own any cryptocurrency?",
    a: "You do not need to own crypto beforehand. During checkout, you can select Transak or Alchemy Pay, which allows you to purchase the exact USDC amount required directly using your Credit Card, Debit Card, or local bank transfer.",
  },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero search */}
        <section className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-28 pb-20 text-center relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200')] bg-cover bg-center opacity-5" />
          <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-black text-white">
              How can we help you?
            </h1>
            <p className="text-dark-300 text-base max-w-xl mx-auto">
              Search our knowledge base or browse help topics below to find answers to your questions.
            </p>

            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 text-dark-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search FAQs, escrow payments, cancellations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-900/60 backdrop-blur-md border border-white/10 hover:border-primary/50 focus:border-primary text-white placeholder-dark-400 text-sm pl-12 pr-4 py-3.5 rounded-2xl outline-none font-sans transition-all shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Topic Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="card p-6 hover:border-primary/50 group transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-dark-900 text-lg mb-2 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-dark-500 text-xs leading-relaxed">{cat.desc}</p>
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-primary mt-6 hover:gap-2 transition-all cursor-pointer">
                  Browse Articles <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-3xl mx-auto px-4 pb-20 space-y-8">
          <h2 className="text-2xl font-display font-bold text-dark-900 text-center mb-8 border-b border-dark-100 pb-4">
            Frequently Asked Questions
          </h2>
          {filteredFaqs.length === 0 ? (
            <p className="text-center text-dark-400 py-6 text-sm">No results match your search.</p>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <div key={idx} className="card p-6 space-y-2">
                  <h4 className="font-display font-semibold text-dark-900 text-base">{faq.q}</h4>
                  <p className="text-dark-600 text-xs leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Michelle Assist banner */}
        <section className="bg-dark-900 py-12 text-center text-white">
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            <MessageCircle className="w-10 h-10 text-primary mx-auto animate-bounce" />
            <h3 className="text-xl font-bold font-display">Still need help?</h3>
            <p className="text-dark-300 text-xs leading-relaxed">
              Our AI Assistant **Michelle** is available 24/7 to solve your booking questions, guide vetting, or transaction issues.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("ai-chat-trigger");
                if (el) el.click();
              }}
              className="btn-primary inline-flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
            >
              Ask Michelle Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
