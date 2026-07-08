import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Sparkles, Star } from "lucide-react";

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
            <Sparkles className="w-3.5 h-3.5" /> Meet the Mind behind Explomate
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display">
            Founder
          </h1>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            Dedicated to building a decentralized travel economy where local guides get paid fairly and tourists enjoy authentic, vetted adventures.
          </p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </section>

      {/* Featured Founder Card */}
      <section className="py-24 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="card bg-white border border-dark-200 shadow-xl overflow-hidden group hover:border-primary/30 hover:shadow-2xl transition-all duration-300">
            {/* Profile Photo */}
            <div className="relative aspect-square w-full bg-dark-100 overflow-hidden">
              <img 
                src="/assets/founder(1).jpeg" 
                alt="Rayhan Aziel Abbrar" 
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500" 
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-dark-100">
                <Star className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Info */}
            <div className="p-8 space-y-4">
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold text-dark-900 group-hover:text-primary transition-colors">
                  Rayhan Aziel Abbrar
                </h3>
                <p className="text-sm font-semibold text-secondary-600 mt-1">
                  Founder & Chief Executive
                </p>
              </div>
              <p className="text-sm text-dark-500 leading-relaxed font-sans text-center">
                Visionary behind Explomate. Championing the integration of travel experiences and decentralized Web3 technologies to deliver local value and secure transaction escrow globally.
              </p>
            </div>
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
