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

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-dark-900 mb-4">Our Mission</h2>
              <p className="text-dark-600 leading-relaxed mb-4">
                Explomate was born from a simple idea: travel should be authentic, accessible, and fair for everyone.
                We connect tourists directly with local tour guides, cutting out middlemen and using blockchain
                technology to ensure secure, transparent payments.
              </p>
              <p className="text-dark-600 leading-relaxed">
                By leveraging USDT/USDC stablecoins, we enable instant cross-border payments without
                high fees or banking barriers. Guides get paid fairly, tourists get authentic experiences,
                and everyone benefits from the trust that smart contracts provide.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Globe, title: "50+ Countries", desc: "Global coverage" },
                { icon: Heart, title: "15,000+", desc: "Happy travelers" },
                { icon: Shield, title: "100%", desc: "Escrow protected" },
                { icon: Zap, title: "$2M+", desc: "Paid in crypto" },
              ].map((stat) => (
                <div key={stat.title} className="card p-6 text-center">
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xl font-bold text-dark-900">{stat.title}</p>
                  <p className="text-sm text-dark-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark-900 mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: GlobeIcon, title: "Authentic Experiences", desc: "Real local guides sharing their culture and expertise with travelers from around the world." },
              { Icon: LockClosedIcon, title: "Trust & Security", desc: "Blockchain escrow ensures payments are protected. No middlemen, no hidden fees." },
              { Icon: Scale, title: "Fair for Everyone", desc: "Low commission rates mean guides earn more. Transparent pricing means tourists pay fairly." },
            ].map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <value.Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-dark-900 text-lg mb-2">{value.title}</h3>
                <p className="text-dark-500 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
