import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Sparkles, Code2, Users, Compass } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-36 pb-32 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/80 to-dark-950" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 text-primary-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Driven by Decentralized Innovation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
            Our Team & Ecosystem
          </h1>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            Explomate is powered by a global network of open-source contributors, Web3 security auditors, and passionate local tour guides.
          </p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </section>

      {/* Ecosystem Pillars */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-8 bg-white border border-dark-200 shadow-md rounded-3xl space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 font-display">Protocol Developers</h3>
            <p className="text-dark-500 text-sm leading-relaxed">
              Engineers designing transparent smart contract escrows on Base layer 2 to minimize gas fees and eliminate intermediate payout bottlenecks.
            </p>
          </div>

          <div className="card p-8 bg-white border border-dark-200 shadow-md rounded-3xl space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 font-display">Verified Guides</h3>
            <p className="text-dark-500 text-sm leading-relaxed">
              Local ambassadors and adventure leaders who curate authentic experiences while receiving 90% direct payout split.
            </p>
          </div>

          <div className="card p-8 bg-white border border-dark-200 shadow-md rounded-3xl space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 font-display">Global Community</h3>
            <p className="text-dark-500 text-sm leading-relaxed">
              Explorers across the world who leave transparent reviews and foster peer-to-peer trust in local tourism.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Vision Footer Banner */}
      <section className="py-16 bg-white border-t border-dark-200/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <Shield className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-dark-900 font-display">
            Built on Trust & Transparency
          </h2>
          <p className="text-dark-500 text-sm max-w-xl mx-auto leading-relaxed">
            By removing financial intermediaries and securing escrow with decentralized smart contracts, we are bringing real, long-term trust to peer-to-peer tourism.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
