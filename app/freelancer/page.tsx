"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Briefcase, 
  Wallet, 
  Calendar, 
  DollarSign, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Shield,
  CheckCircle,
  Sparkles,
  Users,
  Compass,
  Star,
  Zap
} from "lucide-react";
import { Crosshair2Icon } from "@radix-ui/react-icons";

export default function FreelancerPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-32 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920')] bg-cover bg-center opacity-25" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary-300 mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-white/90">Join as a Freelance Local Expert</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6"
          >
            Earn Money Doing What <br className="hidden sm:inline" />
            <span className="text-primary-400">
              You Absolutely Love
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-dark-200 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Become an Explomate Freelance Tour Guide. Share your city&apos;s best hidden spots, host unique experiences for global travelers, and get paid instantly in crypto.
          </motion.p>
 
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register?role=guide" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold shadow-lg shadow-primary/25 w-full sm:w-auto text-center justify-center cursor-pointer">
              Apply as Guide <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login?role=guide" className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-3.5 text-sm font-bold rounded-xl transition-all w-full sm:w-auto text-center justify-center cursor-pointer">
              Guide Dashboard Login
            </Link>
          </motion.div>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" className="fill-dark-50 dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      {/* Perks Grid (Light Theme Card Grid) */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-3">Why Explomate?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4 font-display">Why Freelance with Us?</h2>
            <p className="text-dark-500 text-base md:text-lg max-w-2xl mx-auto">Explomate is designed to give power back to local experts with modern technology.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: DollarSign,
                color: "text-green-600 bg-green-500/10",
                title: "Keep 90% of Earnings",
                desc: "Traditional agencies take up to 40% cut. With Explomate, platform commission is only 10%. You keep what is rightfully yours."
              },
              {
                icon: Wallet,
                color: "text-primary bg-primary/10",
                title: "Instant Web3 Payouts",
                desc: "No waiting for slow monthly bank wires. Payouts are settled immediately in USDT or USDC right to your linked crypto wallet."
              },
              {
                icon: Calendar,
                color: "text-secondary bg-secondary/10",
                title: "Complete Flexibility",
                desc: "You are the boss. Host tours whenever you want, set your own group limits, calendar rules, and custom tour pricing."
              }
            ].map((perk) => (
              <motion.div key={perk.title} variants={itemVariants} className="card p-8 text-left hover:shadow-lg transition-all border border-dark-100 bg-white rounded-3xl group">
                <div className={`w-14 h-14 rounded-2xl ${perk.color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                  <perk.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-3">{perk.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet Your Guide Step Section (Clean White Background) */}
      <section className="py-20 bg-white border-y border-dark-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Steps Left */}
            <div>
              <div className="inline-flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider mb-2">
                <Crosshair2Icon className="w-4 h-4" /> Simple Onboarding
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-8 font-display">How to Start Earning</h2>
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Create Your Guide Profile",
                    desc: "Register your guide account, add a profile photo, and write a bio highlighting your local knowledge and languages."
                  },
                  {
                    step: "02",
                    title: "Publish Your Tour Packages",
                    desc: "List specific activities with photos, descriptions, pricing in USD, group limits, and meeting points."
                  },
                  {
                    step: "03",
                    title: "Host and Receive Payouts",
                    desc: "Coordinate details with tourists using our secure chat, guide them safely, and receive instant USDC/USDT directly to your wallet."
                  }
                ].map((step) => (
                  <div key={step.step} className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary font-display font-black text-lg flex items-center justify-center">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-dark-900 mb-1">{step.title}</h3>
                      <p className="text-dark-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration Right */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden border border-dark-100 shadow-xl bg-dark-50">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" 
                  alt="Tour Guide Freelancer working on listing tours" 
                  className="w-full h-[440px] object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-lg max-w-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark-900">Escrow Protected</p>
                        <p className="text-[11px] text-dark-500 font-medium">Guaranteed payment release on tour completion</p>
                      </div>
                    </div>
                    <p className="text-xs text-dark-600 leading-relaxed">
                      All tourist payments are locked securely in Smart Contract Escrow on Avalanche C-Chain until the tour finishes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Showcase Section */}
      <section className="py-20 bg-dark-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image Left */}
            <div className="relative order-2 lg:order-1">
              <img 
                src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800" 
                alt="Explomate Guide showing sights to tourists" 
                className="relative rounded-3xl overflow-hidden border border-dark-100 shadow-xl w-full h-[420px] object-cover" 
              />
            </div>

            {/* Content Right */}
            <div className="order-1 lg:order-2">
              <span className="badge badge-primary mb-3">Authentic Experiences</span>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-6 font-display">Host Travelers Worldwide</h2>
              <p className="text-dark-600 text-base leading-relaxed mb-6">
                Travelers are searching for raw, genuine experiences. They don&apos;t want commercial bus tours — they want to discover a city through the eyes of a passionate resident.
              </p>
              <div className="space-y-3.5">
                {[
                  "Showcase your unique passions (food, photography, hiking, history)",
                  "Chat directly with clients to coordinate pick-up locations and schedules",
                  "Translate local dialects and introduce authentic culinary secrets",
                  "Build a trusted profile with verified, on-chain traveler reviews",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-dark-100 shadow-xs">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-dark-800 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section (Consistent with How-It-Works) */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Smart Contract Escrow Guarantee</h2>
          <p className="text-dark-300 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Your time and effort are valued. All booking payments are locked in Smart Contract Escrow before you step out, guaranteeing fair, on-time disbursement.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              "100% upfront booking lock",
              "Low 10% platform fee",
              "Direct wallet payout",
              "Dispute mediation support",
              "Transparent blockchain ledger",
              "Avalanche C-Chain Protection",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-dark-800 border border-dark-700/60">
                <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-dark-200 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section (Clean Vibrant Blue Background matching How-It-Works) */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Start Your Freelancing Journey Today</h2>
          <p className="text-white/80 text-base mb-8 max-w-xl mx-auto">
            Become a local pioneer. Get listed, show tourists the magic of your city, and secure your financial freedom.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=guide" className="bg-white text-primary font-bold py-3.5 px-8 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto text-sm cursor-pointer">
              Create Guide Account
            </Link>
            <Link href="/auth/login?role=guide" className="bg-dark-900 text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-lg transition-all w-full sm:w-auto text-sm cursor-pointer">
              Guide Dashboard Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
