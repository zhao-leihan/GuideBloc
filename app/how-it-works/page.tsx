import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Search, Calendar, CreditCard, MapPin, Users, Wallet, Shield, CheckCircle } from "lucide-react";
import { GlobeIcon, Crosshair2Icon } from "@radix-ui/react-icons";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-32 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200')] bg-cover bg-center opacity-25" />
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">How Explomate Works</h1>
          <p className="text-xl text-dark-200">Discover, book, and pay for unique tours - powered by blockchain.</p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" className="fill-dark-50 dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      {/* For Tourists */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <GlobeIcon className="w-3.5 h-3.5 text-primary" />
              <span>Tourist Experience</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              How It Works for Tourists
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Discover verified local experiences, book with crypto, and enjoy smart contract escrow protection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Search, 
                step: "01", 
                title: "Discover Tours", 
                desc: "Browse authentic tours by destination, category, price, and verified reviews from real travelers.",
                gradient: "from-primary/15 via-primary/5 to-transparent",
                iconBg: "bg-primary/10 text-primary border border-primary/20"
              },
              { 
                icon: Calendar, 
                step: "02", 
                title: "Book & Lock in Escrow", 
                desc: "Select departure date and time slot. Pay seamlessly in USDT/USDC directly from your crypto wallet.",
                gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
                iconBg: "bg-blue-50 text-blue-600 border border-blue-200/60"
              },
              { 
                icon: MapPin, 
                step: "03", 
                title: "Meet Guide & Explore", 
                desc: "Meet at designated meetup spot, experience unique local gems, and funds release once tour completes.",
                gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
              },
            ].map((item) => (
              <div 
                key={item.step} 
                className="relative bg-white p-8 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-2.5 tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-dark-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Guides */}
      <section className="py-24 bg-white border-y border-dark-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Crosshair2Icon className="w-3.5 h-3.5 text-secondary" />
              <span>Guide Journey</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              How It Works for Tour Guides
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Share your passion, set your own schedule, and earn instant stablecoin payouts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: MapPin, 
                step: "01", 
                title: "Create Your Gig", 
                desc: "List your tour with photos, language options, designated meeting point, schedule, and custom inclusions.",
                gradient: "from-secondary/15 via-secondary/5 to-transparent",
                iconBg: "bg-secondary/10 text-secondary border border-secondary/20"
              },
              { 
                icon: Users, 
                step: "02", 
                title: "Accept Bookings", 
                desc: "Review incoming requests, coordinate details with tourists via encrypted chat, and prepare for departure.",
                gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
                iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60"
              },
              { 
                icon: Wallet, 
                step: "03", 
                title: "Instant Web3 Payout", 
                desc: "Receive 90% of booking fees in USDT/USDC directly to your linked wallet right after tour conclusion.",
                gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
              },
            ].map((item) => (
              <div 
                key={item.step} 
                className="relative bg-white p-8 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-2.5 tracking-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-dark-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Secure Crypto Escrow</h2>
          <p className="text-dark-300 text-lg mb-8">
            All payments are held in a smart contract escrow. Funds are only released to the guide after the tour is completed. Your money is protected at every step.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              "Funds locked in escrow on booking",
              "Commission deducted automatically",
              "Dispute resolution by admin",
              "Refund protection for cancellations",
              "On-chain transparency",
              "Avalanche C-Chain Escrow Protection",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-dark-800">
                <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-dark-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=tourist" className="bg-white text-primary font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition-all">
              I&apos;m a Tourist
            </Link>
            <Link href="/auth/register?role=guide" className="bg-dark-900 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition-all">
              I&apos;m a Guide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
