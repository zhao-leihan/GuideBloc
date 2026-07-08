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
          <p className="text-xl text-dark-200">Discover, book, and pay for unique tours — powered by blockchain.</p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </section>

      {/* For Tourists */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark-900 mb-12 text-center flex items-center justify-center gap-3">
            <GlobeIcon className="w-8 h-8 text-primary" /> For Tourists
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: 1, title: "Discover Tours", desc: "Browse tours by destination, category, price, and rating. Read reviews from other travelers." },
              { icon: Calendar, step: 2, title: "Book & Pay", desc: "Select your date and group size. Pay securely with USDT or USDC via crypto wallet." },
              { icon: MapPin, step: 3, title: "Enjoy the Tour", desc: "Meet your guide, explore, and create memories. Leave a review after your experience." },
            ].map((item) => (
              <div key={item.step} className="card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <span className="badge badge-primary mb-3">Step {item.step}</span>
                <h3 className="font-display font-bold text-dark-900 text-lg mb-2">{item.title}</h3>
                <p className="text-dark-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Guides */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark-900 mb-12 text-center flex items-center justify-center gap-3">
            <Crosshair2Icon className="w-8 h-8 text-secondary" /> For Tour Guides
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, step: 1, title: "Create Your Gig", desc: "List your tour with photos, description, pricing, and availability. Set your own schedule." },
              { icon: Users, step: 2, title: "Accept Bookings", desc: "Review incoming requests, accept or decline. Coordinate with tourists via chat." },
              { icon: Wallet, step: 3, title: "Get Paid in Crypto", desc: "Receive USDT/USDC directly to your wallet. Platform commission is deducted automatically." },
            ].map((item) => (
              <div key={item.step} className="card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-secondary" />
                </div>
                <span className="badge badge-secondary mb-3">Step {item.step}</span>
                <h3 className="font-display font-bold text-dark-900 text-lg mb-2">{item.title}</h3>
                <p className="text-dark-500 text-sm">{item.desc}</p>
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
              "Multi-network support (Polygon, Base)",
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
