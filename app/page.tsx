"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import AIChatAssistant from "@/components/ai/AIChatAssistant";
import {
  Search,
  Shield,
  Wallet,
  MapPin,
  Star,
  ArrowRight,
  Globe,
  Users,
  Calendar,
  CreditCard,
  Compass,
  Sparkles,
  ShieldCheck,
  Lock,
  UserCheck,
  Coins,
} from "lucide-react";
import {
  LightningBoltIcon,
  ColumnsIcon,
  MixIcon,
  SunIcon,
  DesktopIcon,
  ShuffleIcon,
  FileTextIcon,
  CameraIcon,
} from "@radix-ui/react-icons";
import GigCard from "@/components/gigs/GigCard";

const featuredDestinations = [
  {
    id: "1",
    title: "Bali, Indonesia",
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "2",
    title: "Tokyo, Japan",
    images: ["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "3",
    title: "Santorini, Greece",
    images: ["https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "4",
    title: "Marrakech, Morocco",
    images: ["https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "5",
    title: "Machu Picchu, Peru",
    images: ["https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "6",
    title: "Bangkok, Thailand",
    images: ["https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80"],
  },
];

const categories = [
  { name: "Adventure", Icon: LightningBoltIcon, count: 234 },
  { name: "Cultural", Icon: ColumnsIcon, count: 189 },
  { name: "Food & Drink", Icon: MixIcon, count: 156 },
  { name: "Nature", Icon: SunIcon, count: 178 },
  { name: "City Tours", Icon: DesktopIcon, count: 201 },
  { name: "Water Sports", Icon: ShuffleIcon, count: 134 },
  { name: "Historical", Icon: FileTextIcon, count: 112 },
  { name: "Photography", Icon: CameraIcon, count: 87 },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Tourist from USA",
    text: "Explomate made my Bali trip unforgettable. The crypto payment was seamless and my guide Ahmad was incredible!",
    rating: 5,
  },
  {
    name: "Marco Rossi",
    role: "Tour Guide, Italy",
    text: "As a guide, I love that I get paid directly in USDT. The platform is intuitive and the tourists are amazing.",
    rating: 5,
  },
  {
    name: "Ayumi Sato",
    role: "Tourist from Japan",
    text: "The best platform for finding authentic local experiences. The booking process is so smooth.",
    rating: 5,
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [loaded, setLoaded] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/experience")
      .then((res) => res.json())
      .then((data) => {
        if (data.experiences) {
          setExperiences(data.experiences);
        }
      })
      .catch((err) => console.error("Error fetching experiences:", err));
  }, []);

  const handleAIClick = () => {
    if (aiInput.trim()) {
      setAiQuery(aiInput);
      setAiInput("");
    } else {
      setAiQuery("Hi Kira!");
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-24 pb-44">
        <div className="absolute inset-0 bg-[url('/assets/background.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-dark-950/45" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">


            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="font-display text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6"
            >
              The Future of Travel is Here.
              <br />
              <span className="bg-gradient-to-r from-primary-300 via-blue-200 to-white bg-clip-text text-transparent">Zero Risk, 100% Guaranteed Payouts.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="text-xl text-dark-300 max-w-3xl mx-auto mb-8 leading-relaxed font-sans"
            >
              Say goodbye to travel scams, hidden platform markups, and payment delays! Explomate locks your booking funds in next-generation <b>Smart Contract Escrow</b> - releasing payment to your guide only after your tour is complete.
            </motion.p>

          {/* AI Talk Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="max-w-xl mx-auto mb-10 relative group"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-300" />
            <div className="relative flex items-center bg-dark-900/60 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all rounded-2xl overflow-hidden p-1.5 shadow-2xl">
              <div className="pl-3 text-primary-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <input
                type="text"
                placeholder="Ask Kira about tours, guides, or bookings..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAIClick();
                }}
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-white placeholder-dark-400 text-sm px-3 py-2.5 font-sans"
              />
              <button
                onClick={handleAIClick}
                className="bg-primary hover:bg-primary-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25 whitespace-nowrap"
              >
                Ask Kira <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link 
              href="/explore" 
              className="bg-primary hover:bg-primary-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 w-full sm:w-auto text-center cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Explore Adventures
            </Link>
            <Link 
              href="/auth/register?role=guide" 
              className="border border-white/20 text-white hover:bg-white/10 font-bold text-sm px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto text-center cursor-pointer"
            >
              <Users className="w-4 h-4" /> Become a Tour Guide
            </Link>
          </motion.div>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[60px] md:h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#FFFFFF" className="fill-white dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      {/* Safe Escrow Travel Protocol Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-white relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-10 -right-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary/20 dark:border-primary/40 border border-primary-200/60 text-xs font-bold uppercase tracking-wider escrow-badge-text">
              <ShieldCheck className="w-4 h-4 escrow-badge-text" style={{ color: "#000000" }} />
              <span className="font-bold escrow-badge-text" style={{ color: "#000000" }}>Decentralized Escrow Protection</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Why Travelers & Guides Trust Explomate
            </h2>
            <p className="text-dark-500 text-base md:text-lg leading-relaxed">
              We leverage Base network smart contract technology to ensure 100% payout security, zero upfront payment risk, and seamless peer-to-peer travel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-dark-50/70 border border-dark-100 hover:border-primary/40 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display">Smart Contract Escrow</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Tour funds remain safely locked in a smart contract and are only released to the guide once you complete your trip.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-dark-50/70 border border-dark-100 hover:border-primary/40 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display">Zero Dispute Fraud</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Cryptographic transaction verification prevents fake payment receipts, chargeback scams, and unauthorized cancellations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-dark-50/70 border border-dark-100 hover:border-primary/40 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display">Vetted Local Guides</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Every guide undergoes identity document verification (KTP/ID) and community reviews before taking bookings.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-dark-50/70 border border-dark-100 hover:border-primary/40 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <Coins className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display">Low 10% Platform Fee</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Guides keep 90% of their earnings with automatic Base stablecoin payouts directly to their Web3 EVM wallet.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Featured Gigs */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 bg-dark-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-3">
                Top Destinations
              </h2>
              <p className="text-dark-500 text-lg">Explore the most beautiful places around the globe</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => (
              <div key={dest.id} className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 aspect-[4/3]">
                <div className="absolute inset-0">
                  <img 
                    src={dest.images[0]} 
                    alt={dest.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-2xl font-display font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">
                    {dest.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/explore" className="btn-outline inline-flex items-center gap-2">
              View All Tours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-3">
              How It Works
            </h2>
            <p className="text-dark-500 text-lg">Start exploring in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Tourists */}
            <div>
              <h3 className="font-display text-xl font-bold text-dark-900 mb-8 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> For Tourists
              </h3>
              <div className="space-y-8">
                {[
                  { icon: Search, title: "Discover", desc: "Browse tours by destination, category, or rating." },
                  { icon: Calendar, title: "Book", desc: "Choose your date, group size, and confirm." },
                  { icon: CreditCard, title: "Pay with Crypto", desc: "Settle securely with USDT/USDC on Avalanche C-Chain or Base L2." },
                ].map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary">STEP {i + 1}</span>
                      </div>
                      <h4 className="font-display font-semibold text-dark-900">{step.title}</h4>
                      <p className="text-dark-500 text-sm mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Guides */}
            <div>
              <h3 className="font-display text-xl font-bold text-dark-900 mb-8 flex items-center gap-2">
                <Compass className="w-5 h-5 text-secondary" /> For Tour Guides
              </h3>
              <div className="space-y-8">
                {[
                  { icon: MapPin, title: "List Your Tour", desc: "Create gigs with photos, pricing, and details." },
                  { icon: Users, title: "Accept Bookings", desc: "Review requests and manage your schedule." },
                  { icon: Wallet, title: "Get Paid", desc: "Receive USDT/USDC directly to your wallet." },
                ].map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-secondary">STEP {i + 1}</span>
                      </div>
                      <h4 className="font-display font-semibold text-dark-900">{step.title}</h4>
                      <p className="text-dark-500 text-sm mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Our Experience */}
      {experiences.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="py-20 bg-white border-t border-dark-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-3 font-display">
                Our Experience
              </h2>
              <p className="text-dark-500 text-lg">Real moments captured by our travelers during vetted local tours</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="card overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={exp.proofPhoto} 
                      alt={exp.gig?.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-dark-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {exp.gig?.title}
                      </h4>
                      <p className="text-[11px] text-dark-400 mt-0.5">{exp.gig?.location}</p>
                    </div>
                    <div className="flex items-center gap-2 border-t border-dark-100 pt-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center font-bold text-primary text-[10px]">
                        {exp.tourist?.avatar ? (
                          <img src={exp.tourist.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          exp.tourist?.name[0]
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-dark-700">{exp.tourist?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Testimonials */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 bg-dark-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Loved by Travelers & Guides
            </h2>
            <p className="text-dark-400 text-lg">See what our community says</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card-dark p-8">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-dark-200 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-display font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-dark-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section - Premium Web3 Aesthetic */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-dark-950 relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="p-8 md:p-14 rounded-[2.5rem] bg-gradient-to-b from-dark-900/90 to-dark-900/40 border border-white/10 backdrop-blur-2xl text-center shadow-2xl space-y-8 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Join the Decentralized Travel Economy</span>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight font-display leading-tight">
                Ready to Start Your <span className="bg-gradient-to-r from-primary-400 via-blue-300 to-white bg-clip-text text-transparent">Adventure?</span>
              </h2>
              <p className="text-dark-300 text-base md:text-lg leading-relaxed font-sans">
                Join thousands of verified travelers and local guides on Explomate to experience authentic journeys secured by smart contract escrow.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link 
                href="/auth/register?role=tourist" 
                className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white font-bold py-4 px-9 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <span>I&apos;m a Tourist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link 
                href="/auth/register?role=guide" 
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-bold py-4 px-9 rounded-2xl border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <span>I&apos;m a Guide</span>
                <Globe className="w-4 h-4 text-dark-300" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
      <AIChatAssistant initialQuery={aiQuery} onCloseInput={() => setAiQuery("")} />
      </motion.div>
    </div>
  );
}
