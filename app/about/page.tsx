import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Globe, Heart, Shield, Zap, Scale } from "lucide-react";
import { GlobeIcon, LockClosedIcon } from "@radix-ui/react-icons";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <section className="relative pt-36 pb-32 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200')] bg-cover bg-center opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Explomate</h1>
          <p className="text-xl text-dark-200">
            Where Adventure Meets Web3. Connecting tourists with local guides worldwide through blockchain-powered trust.
          </p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" className="fill-dark-50 dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>Our Purpose</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display mb-6">
                Our Mission & Vision
              </h2>
              <p className="text-dark-600 leading-relaxed mb-5 text-base sm:text-lg">
                Explomate was born from a simple idea: travel should be authentic, accessible, and fair for everyone.
                We connect tourists directly with local tour guides, cutting out middlemen and using blockchain
                technology to ensure secure, transparent payments.
              </p>
              <p className="text-dark-600 leading-relaxed text-base sm:text-lg">
                By leveraging USDT/USDC stablecoins on Avalanche C-Chain, we enable instant cross-border payments without
                high bank wire fees or geographical barriers. Guides get paid fairly, tourists get authentic experiences,
                and everyone benefits from the trust that smart contracts provide.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: Globe, title: "50+ Countries", desc: "Global coverage", gradient: "from-primary/15 via-primary/5 to-transparent", color: "bg-primary/10 text-primary border-primary/20" },
                { icon: Heart, title: "15,000+", desc: "Happy travelers", gradient: "from-rose-500/15 via-rose-500/5 to-transparent", color: "bg-rose-50 text-rose-600 border-rose-200/60" },
                { icon: Shield, title: "100%", desc: "Escrow protected", gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent", color: "bg-emerald-50 text-emerald-600 border-emerald-200/60" },
                { icon: Zap, title: "$2M+", desc: "Paid in crypto", gradient: "from-amber-500/15 via-amber-500/5 to-transparent", color: "bg-amber-50 text-amber-600 border-amber-200/60" },
              ].map((stat) => (
                <div key={stat.title} className="relative bg-white p-7 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden text-center">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${stat.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${stat.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <p className="text-2xl font-black text-dark-900 font-display tracking-tight">{stat.title}</p>
                  <p className="text-xs font-semibold text-dark-500 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-y border-dark-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Scale className="w-3.5 h-3.5 text-secondary" />
              <span>Core Principles</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Our Values & Standards
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Built on transparency, community empowerment, and state-of-the-art crypto escrow technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                Icon: GlobeIcon, 
                title: "Authentic Experiences", 
                desc: "Real local guides sharing their culture, hidden spots, and unique expertise with travelers from around the world.",
                gradient: "from-primary/15 via-primary/5 to-transparent",
                color: "bg-primary/10 text-primary border border-primary/20"
              },
              { 
                Icon: LockClosedIcon, 
                title: "Trust & Security", 
                desc: "Smart contract escrow guarantees your funds are protected. No middlemen, no chargebacks, and zero hidden fees.",
                gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
                color: "bg-blue-50 text-blue-600 border border-blue-200/60"
              },
              { 
                Icon: Scale, 
                title: "Fair for Everyone", 
                desc: "Low 10% platform commission means guides keep 90% of their earnings, while tourists pay direct transparent rates.",
                gradient: "from-secondary/15 via-secondary/5 to-transparent",
                color: "bg-secondary/10 text-secondary border border-secondary/20"
              },
            ].map((value) => (
              <div 
                key={value.title} 
                className="relative bg-dark-50/70 p-8 rounded-3xl border border-dark-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:bg-white hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${value.gradient} rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500`} />
                <div className={`w-14 h-14 mb-6 rounded-2xl ${value.color} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                  <value.Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-2.5 tracking-tight group-hover:text-primary transition-colors">{value.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
