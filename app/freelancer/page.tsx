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
  Sparkles,
  CheckCircle2,
  Users,
  Compass,
  Star
} from "lucide-react";

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
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-dark-900 selection:bg-primary-500/20 selection:text-primary-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-28 md:pb-36 overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-slate-50">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-200/80 bg-white text-primary-700 mb-6 shadow-sm backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">Join as a Freelance Local Guide</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-dark-950 leading-[1.15] mb-6 tracking-tight"
          >
            Earn Money Doing What
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-600 to-indigo-600">
              You Absolutely Love
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-base sm:text-lg md:text-xl text-dark-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Become an Explomate Freelance Tour Guide. Share your city&apos;s best hidden spots, host unique experiences for global travelers, and get paid instantly in crypto.
          </motion.p>
 
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/auth/register?role=guide" 
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 w-full sm:w-auto text-center justify-center rounded-2xl cursor-pointer"
            >
              Apply as Guide <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/auth/login?role=guide" 
              className="bg-white border border-dark-200/90 hover:border-primary/50 text-dark-800 hover:text-primary px-8 py-4 text-base font-bold rounded-2xl transition-all w-full sm:w-auto text-center justify-center shadow-sm hover:shadow-md cursor-pointer"
            >
              Guide Dashboard Login
            </Link>
          </motion.div>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-14 pt-8 border-t border-dark-100 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
          >
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-dark-900">90%</p>
              <p className="text-xs sm:text-sm text-dark-500 font-medium mt-0.5">Direct Payout Rate</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-dark-900">&lt; 1 min</p>
              <p className="text-xs sm:text-sm text-dark-500 font-medium mt-0.5">Escrow Release Time</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-dark-900">$0</p>
              <p className="text-xs sm:text-sm text-dark-500 font-medium mt-0.5">Listing or Setup Fees</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-primary flex items-center justify-center gap-1">
                4.9 <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
              </p>
              <p className="text-xs sm:text-sm text-dark-500 font-medium mt-0.5">Avg Guide Rating</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="py-24 bg-white border-y border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-primary uppercase tracking-wider text-xs font-bold px-3 py-1 mb-3">
              Why Choose Explomate
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-dark-950 font-display mt-2 mb-4">
              Why Freelance with Us?
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto">
              Explomate is designed to give power and maximum earnings back to local experts with modern Web3 technology.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: DollarSign,
                color: "bg-emerald-50 text-emerald-600 border-emerald-200",
                title: "Keep 90% of Earnings",
                desc: "Traditional agencies take up to 40% cut. With Explomate, our commission is a flat 10%. You keep what is rightfully yours."
              },
              {
                icon: Wallet,
                color: "bg-primary-50 text-primary border-primary-200",
                title: "Instant Web3 Payouts",
                desc: "No waiting for monthly bank wires. Payments are settled immediately in USDT or USDC stablecoins right after your tour concludes."
              },
              {
                icon: Calendar,
                color: "bg-amber-50 text-amber-600 border-amber-200",
                title: "Complete Schedule Flexibility",
                desc: "You are the boss. Host tours whenever you want, set your own group sizes, calendar rules, and custom package pricing."
              }
            ].map((perk) => (
              <motion.div 
                key={perk.title} 
                variants={itemVariants} 
                className="bg-white p-8 rounded-3xl border border-dark-150 hover:border-primary hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${perk.color}`}>
                  <perk.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-dark-900 mb-3">{perk.title}</h3>
                <p className="text-dark-500 text-sm leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet Your Guide Step Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Steps Left */}
            <div>
              <span className="badge badge-primary uppercase tracking-wider text-xs font-bold px-3 py-1 mb-3">
                Simple Onboarding
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-dark-950 font-display mt-2 mb-10">
                How to Start Earning
              </h2>
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Create Your Guide Profile",
                    desc: "Register a guide account, upload a friendly profile photo, and write a bio detailing your local expertise and languages spoken."
                  },
                  {
                    step: "02",
                    title: "Publish Your Tour Packages",
                    desc: "List specific activities (gigs) with descriptions, pricing in USD, photos, group limits, meeting points, and what is included."
                  },
                  {
                    step: "03",
                    title: "Host and Receive Instant Payouts",
                    desc: "Coordinate details with tourists using our secure chat, guide them safely, and watch USDT/USDC arrive instantly in your linked crypto wallet."
                  }
                ].map((step) => (
                  <div key={step.step} className="flex gap-5 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-dark-200 shadow-sm font-display text-lg font-black text-primary flex items-center justify-center">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-dark-900 mb-1.5">{step.title}</h3>
                      <p className="text-dark-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration Right */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden border border-dark-200 shadow-xl bg-white">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" 
                  alt="Tour Guide Freelancer working on listing tours" 
                  className="w-full h-[460px] object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent flex items-end p-6 sm:p-8">
                  <div className="bg-white/95 border border-dark-100 rounded-2xl p-5 backdrop-blur-md max-w-sm shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark-900">Safe & Escrow Secured</p>
                        <p className="text-xs text-dark-400">Guaranteed payment security</p>
                      </div>
                    </div>
                    <p className="text-xs text-dark-600 leading-relaxed">
                      All tourist payments are held in our smart contract escrow. Once you complete the tour, the funds release instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Showcase Section */}
      <section className="py-24 bg-white border-t border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-secondary/5 rounded-3xl blur-2xl pointer-events-none" />
              <img 
                src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800" 
                alt="Explomate Guide showing sights to tourists" 
                className="relative rounded-3xl overflow-hidden border border-dark-200 shadow-xl w-full h-[450px] object-cover" 
              />
            </div>

            {/* Content Right */}
            <div className="order-1 lg:order-2">
              <span className="badge badge-secondary uppercase tracking-wider text-xs font-bold px-3 py-1 mb-3">
                Authentic Experiences
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-dark-950 font-display mt-2 mb-6">
                Host Travelers Worldwide
              </h2>
              <p className="text-dark-600 text-base sm:text-lg leading-relaxed mb-8">
                Travelers are searching for raw, genuine experiences. They don&apos;t want commercial bus tours — they want to discover a city through the eyes of a passionate resident.
              </p>
              <div className="space-y-4">
                {[
                  "Showcase your unique hobbies (street food, photography, hiking, history)",
                  "Chat directly with clients to coordinate pick-up locations and custom requests",
                  "Translate local dialects, culture, and etiquette for international travelers",
                  "Build a trusted reputation with verified on-chain traveler reviews",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-dark-700 text-sm font-medium leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 rounded-3xl p-10 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Ambient Background Circles */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-inner">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight mb-4 text-white">
                Start Your Freelancing Journey Today
              </h2>
              <p className="text-white/85 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Become a local pioneer. Get listed, show tourists the magic of your city, and secure your financial freedom using Web3 payments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/auth/register?role=guide" 
                  className="bg-white text-primary-700 hover:text-primary-800 font-bold py-4 px-10 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all w-full sm:w-auto shadow-lg cursor-pointer"
                >
                  Create Guide Account
                </Link>
                <Link 
                  href="/auth/login" 
                  className="border-2 border-white/40 text-white hover:bg-white/10 font-bold py-4 px-10 rounded-2xl transition-all w-full sm:w-auto cursor-pointer"
                >
                  Sign In to Guide Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
