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
  MessageSquare,
  Sparkles
} from "lucide-react";

export default function FreelancerPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-primary-500/30 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-32 overflow-hidden bg-gradient-to-b from-dark-950 via-dark-900 to-primary-950/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920')] bg-cover bg-center opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide uppercase">Join as a Freelance Local Expert</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-display text-5xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            Earn Money Doing What
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
              You Absolutely Love
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-dark-300 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Become an Explomate Freelance Tour Guide. Share your city&apos;s best hidden spots, host unique experiences for global travelers, and get paid instantly in crypto.
          </motion.p>
 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register?role=guide" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-bold shadow-lg shadow-primary-500/20 w-full sm:w-auto text-center justify-center">
              Apply as Guide <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login?role=guide" className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-base font-bold rounded-xl transition-all w-full sm:w-auto text-center justify-center">
              Guide Dashboard Login
            </Link>
          </motion.div>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#0F172A"></path>
          </svg>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="py-24 bg-dark-900 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Freelance with Us?</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">Explomate is designed to give power back to local experts with modern technology.</p>
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
                title: "Keep 90% of Earnings",
                desc: "Traditional agencies take up to 40% cut. With Explomate, our commission is a flat 10%. You keep what is yours."
              },
              {
                icon: Wallet,
                title: "Instant Web3 Payouts",
                desc: "No waiting for monthly bank wires. Payments are settled immediately in USDT or USDC stablecoins right after your tour concludes."
              },
              {
                icon: Calendar,
                title: "Complete Flexibility",
                desc: "You are the boss. Host tours whenever you want, set your own group sizes, calendar rules, and custom package pricing."
              }
            ].map((perk) => (
              <motion.div key={perk.title} variants={itemVariants} className="bg-dark-950/60 p-8 rounded-2xl border border-dark-800 hover:border-primary-500/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <perk.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3">{perk.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet Your Guide Step Section */}
      <section className="py-24 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Steps Left */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-12">How to Start Earning</h2>
              <div className="space-y-10">
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
                    title: "Host and Receive Payouts",
                    desc: "Coordinate details with tourists using our secure chat, guide them safely, and watch USDT/USDC arrive instantly in your linked crypto wallet."
                  }
                ].map((step, idx) => (
                  <div key={step.step} className="flex gap-6">
                    <div className="flex-shrink-0 font-display text-4xl font-black text-primary-500/20">{step.step}</div>
                    <div>
                      <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                      <p className="text-dark-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration Right */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/10 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden border border-dark-800 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" 
                  alt="Tour Guide Freelancer working on listing tours" 
                  className="w-full h-[450px] object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent flex items-end p-8">
                  <div className="bg-dark-900/90 border border-dark-800 rounded-2xl p-6 backdrop-blur-md max-w-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Safe & Escrow Secured</p>
                        <p className="text-xs text-dark-400">Guaranteed payment security</p>
                      </div>
                    </div>
                    <p className="text-xs text-dark-300">
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
      <section className="py-24 bg-dark-900 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-primary-500/10 rounded-3xl blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800" 
                alt="Explomate Guide showing sights to tourists" 
                className="relative rounded-3xl overflow-hidden border border-dark-800 shadow-2xl w-full h-[450px] object-cover" 
              />
            </div>

            {/* Content Right */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Host Travelers Worldwide</h2>
              <p className="text-dark-300 text-lg leading-relaxed mb-6">
                Travelers are searching for raw, genuine experiences. They don&apos;t want commercial bus tours - they want to discover a city through the eyes of a passionate resident.
              </p>
              <div className="space-y-4">
                {[
                  "Showcase your unique hobbies (food, photography, hiking, history)",
                  "Chat directly with clients to coordinate pick-up locations",
                  "Translate Balinese, Japanese, or local dialects for travelers",
                  "Build a trusted profile with verified, on-chain traveler reviews",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-400" />
                    </div>
                    <span className="text-dark-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-950/40 via-dark-950 to-primary-950/40 border-t border-dark-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Briefcase className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Start Your Freelancing Journey Today</h2>
          <p className="text-dark-300 text-lg mb-8 max-w-2xl mx-auto">
            Become a local pioneer. Get listed, show tourists the magic of your city, and secure your financial freedom using Web3 payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=guide" className="bg-white text-dark-950 font-bold py-4 px-10 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all w-full sm:w-auto">
              Create Guide Account
            </Link>
            <Link href="/auth/login" className="border border-white/20 text-white font-bold py-4 px-10 rounded-xl hover:bg-white/10 transition-all w-full sm:w-auto">
              Sign In to Guide Hub
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
