"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const AIChatAssistant = dynamic(() => import("@/components/ai/AIChatAssistant"), {
  ssr: false,
});
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
    title: "Tokyo, Japan",
    query: "Tokyo",
    images: ["/assets/destinations/tokyo.webp"],
  },
  {
    id: "2",
    title: "Kyoto, Japan",
    query: "Kyoto",
    images: ["/assets/destinations/kyoto.webp"],
  },
  {
    id: "3",
    title: "Osaka, Japan",
    query: "Osaka",
    images: ["/assets/destinations/osaka.jpg"],
  },
  {
    id: "4",
    title: "Mount Fuji, Japan",
    query: "Fuji",
    images: ["/assets/destinations/fuji.webp"],
  },
  {
    id: "5",
    title: "Hokkaido, Japan",
    query: "Hokkaido",
    images: ["/assets/destinations/hokkaido.webp"],
  },
  {
    id: "6",
    title: "Nara, Japan",
    query: "Nara",
    images: ["/assets/destinations/nara.webp"],
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

const fallbackReviews = [
  {
    id: "fb-1",
    rating: 5,
    comment: "GuideBloc. made my Kyoto cultural tour completely worry-free. Funds stayed safely in the smart contract escrow until we finished our tour with Kenji. Truly game-changing!",
    reviewer: { name: "Sarah Chen", role: "TOURIST", country: "United States" },
    gig: { title: "Kyoto Traditional Temples & Hidden Gardens", location: "Kyoto, Japan" }
  },
  {
    id: "fb-2",
    rating: 5,
    comment: "As a local guide in Tokyo, getting paid directly in USDT with zero payment disputes or 3-week chargeback worries is why I moved 100% of my private tours to GuideBloc..",
    reviewer: { name: "Kenji Takahashi", role: "GUIDE", country: "Japan" },
    gig: { title: "Tokyo Street Food & Shibuya Night Explorer", location: "Tokyo, Japan" }
  },
  {
    id: "fb-3",
    rating: 5,
    comment: "Zero hidden bank exchange fees, instant booking confirmation, and total transparency. The peace of mind knowing the guide only gets paid after tour completion is unmatched.",
    reviewer: { name: "Marco Rossi", role: "TOURIST", country: "Italy" },
    gig: { title: "Mount Fuji Panoramic Trekking & Hot Springs", location: "Yamanashi, Japan" }
  },
];

const heroDestinations = [
  {
    id: "fuji",
    name: "Mount Fuji",
    location: "Honshu, Japan",
    image: "/assets/hero/hero-fuji.webp",
  },
  {
    id: "kyoto",
    name: "Yasaka Pagoda",
    location: "Kyoto, Japan",
    image: "/assets/hero/kyoto.jpg",
  },
  {
    id: "tokyo",
    name: "Tokyo Tower & Cityscape",
    location: "Tokyo, Japan",
    image: "/assets/hero/tokyo.jpg",
  },
  {
    id: "osaka",
    name: "Osaka Castle",
    location: "Osaka, Japan",
    image: "/assets/hero/castle.jpg",
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [loaded, setLoaded] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  // Auto transition hero background every 6.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % heroDestinations.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/experience")
      .then((res) => res.json())
      .then((data) => {
        if (data.experiences) {
          setExperiences(data.experiences);
        }
      })
      .catch((err) => console.error("Error fetching experiences:", err));

    fetch("/api/reviews?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error("Error fetching reviews:", err));
  }, []);

  const handleAIClick = () => {
    if (aiInput.trim()) {
      setAiQuery(aiInput);
      setAiInput("");
    } else {
      setAiQuery("Tell me about verified tours in Japan!");
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      <div>
        <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-primary/20 pt-24 pb-44">
        {/* Dynamic Hero Background Carousel with Smooth Crossfade */}
        {heroDestinations.map((dest, idx) => (
          <div
            key={dest.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none z-0 ${
              activeBgIndex === idx ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <Image
              src={dest.image}
              alt={dest.name}
              fill
              priority
              quality={80}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-dark-950/65 z-[1]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">

            {/* Headline - Bold, executive, well-proportioned */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto mb-4 sm:mb-6">
              The Modern Standard for Global Travel Commerce.
            </h1>

            {/* Sub-headline - 50% smaller, muted light gray #94A3B8 */}
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-300 max-w-3xl mx-auto mb-6 tracking-normal">
              Direct Bookings. Automated Escrow. Instant Payouts.
            </p>

            {/* Body Text - Generous whitespace & relaxed reading */}
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
              Eliminate booking scams and cross-border payment delays. GuideBloc holds funds securely in automated escrow, releasing direct settlement to local guides the moment the tour is completed.
            </p>

          {/* AI Travel Concierge Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="max-w-xl mx-auto mb-10 relative group"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-300" />
            <div className="relative flex items-center bg-dark-900/60 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all rounded-2xl overflow-hidden p-1.5 shadow-2xl">
              <div className="pl-3.5 text-primary-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search destinations or ask AI Concierge (e.g. Tokyo food tours, Kyoto temples)..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAIClick();
                }}
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-white placeholder-dark-400 text-sm px-3 py-2.5 font-sans"
              />
              <button
                onClick={handleAIClick}
                className="bg-primary hover:bg-primary-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25 whitespace-nowrap cursor-pointer"
              >
                AI Concierge <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
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

          {/* Destination Switcher / Indicator Tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={loaded ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-3 z-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-900/70 backdrop-blur-md border border-white/10 text-xs text-slate-300 shadow-xl">
              <MapPin className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
              <span className="font-semibold text-white">{heroDestinations[activeBgIndex].name}</span>
              <span className="text-slate-400">· {heroDestinations[activeBgIndex].location}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-dark-900/50 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-full">
              {heroDestinations.map((dest, i) => (
                <button
                  key={dest.id}
                  onClick={() => setActiveBgIndex(i)}
                  aria-label={`Switch background to ${dest.name}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeBgIndex === i
                      ? "w-6 h-1.5 bg-primary shadow-sm shadow-primary/50"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Seamless Pure White Wave Divider */}
        <div className="absolute -bottom-px left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg 
            className="relative block w-full h-[45px] sm:h-[60px] md:h-[75px]" 
            viewBox="0 0 1440 100" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,35 C320,75 520,15 760,50 C1000,85 1200,20 1440,40 L1440,100 L0,100 Z" 
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </section>

      {/* Safe Escrow Travel Protocol Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-10 -right-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Decentralized Escrow Protection</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Why Travelers & Guides Trust GuideBloc.
            </h2>
            <p className="text-dark-500 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              We leverage Avalanche C-Chain smart contract technology to ensure 100% payout security, zero upfront payment risk, and seamless peer-to-peer travel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="relative p-8 rounded-3xl bg-white border border-dark-100/90 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display tracking-tight group-hover:text-primary transition-colors">Smart Contract Escrow</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Tour funds remain safely locked in a smart contract and are only released to the guide once you complete your trip.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative p-8 rounded-3xl bg-white border border-dark-100/90 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/15 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display tracking-tight group-hover:text-primary transition-colors">Zero Dispute Fraud</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Cryptographic transaction verification prevents fake payment receipts, chargeback scams, and unauthorized cancellations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative p-8 rounded-3xl bg-white border border-dark-100/90 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/15 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display tracking-tight group-hover:text-primary transition-colors">Vetted Local Guides</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Every guide undergoes identity document verification (Government ID / Passport) and community reviews before taking bookings.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="relative p-8 rounded-3xl bg-white border border-dark-100/90 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgb(29,78,216,0.08)] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/15 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 duration-500" />
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <Coins className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2 font-display tracking-tight group-hover:text-primary transition-colors">Low 10% Platform Fee</h3>
              <p className="text-dark-500 text-sm leading-relaxed">
                Guides keep 90% of their earnings with automatic Avalanche stablecoin payouts directly to their Web3 EVM wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                Top Destinations in Japan
              </h2>
              <p className="text-dark-500 text-lg">Explore iconic cities, cultural landmarks, and hidden gems across Japan</p>
            </div>
            <Link href="/explore" className="hidden md:inline-flex btn-outline items-center gap-2">
              View All Tours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => (
              <Link 
                key={dest.id} 
                href={`/explore?search=${encodeURIComponent(dest.query || dest.title.split(",")[0].trim())}`}
                className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 aspect-[4/3] block"
              >
                <div className="absolute inset-0">
                  <Image 
                    src={dest.images[0]} 
                    alt={dest.title}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-2xl font-display font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">
                    {dest.title}
                  </h3>
                </div>
              </Link>
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
                  { icon: CreditCard, title: "Pay with Crypto", desc: "Settle securely with USDT/USDC on Avalanche C-Chain." },
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
                      loading="lazy"
                      decoding="async"
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
                          <img src={exp.tourist.avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
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

      {/* Testimonials - Light Mode & Database-driven */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-slate-50 border-t border-b border-dark-100/70 relative overflow-hidden"
      >
        {/* Decorative soft blur background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Verified Community Feedback</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Loved by Travelers & Guides
            </h2>
            <p className="text-dark-500 text-base md:text-lg leading-relaxed font-sans">
              Authentic reviews verified directly from completed smart contract escrow bookings across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews.length > 0 ? reviews : fallbackReviews).map((reviewItem: any, index: number) => {
              const reviewerName = reviewItem.reviewer?.name || "Traveler";
              const reviewerAvatar = reviewItem.reviewer?.avatar;
              const location = reviewItem.gig?.location || reviewItem.gig?.title || reviewItem.reviewer?.country || "Verified Experience";
              const ratingCount = Math.min(5, Math.max(1, reviewItem.rating || 5));

              return (
                <div 
                  key={reviewItem.id || index} 
                  className="bg-white border border-dark-100/90 rounded-3xl p-8 shadow-[0_4px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgb(29,78,216,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: ratingCount }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Escrow Verified
                      </span>
                    </div>

                    <p className="text-dark-700 text-sm md:text-base leading-relaxed italic mb-6">
                      &ldquo;{reviewItem.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-5 border-t border-dark-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 via-blue-100 to-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center font-bold text-primary text-sm flex-shrink-0 shadow-xs">
                      {reviewerAvatar ? (
                        <img src={reviewerAvatar} alt={reviewerName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        reviewerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-dark-900 text-sm truncate group-hover:text-primary transition-colors">
                        {reviewerName}
                      </p>
                      <p className="text-xs text-dark-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-dark-400 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section - Light Mode & Refreshed Content */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-white relative overflow-hidden"
      >
        {/* Soft Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-100/60 to-primary-100/50 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="p-8 md:p-14 rounded-[2.5rem] bg-gradient-to-br from-blue-50/90 via-white to-primary-50/60 border border-blue-200/70 text-center shadow-[0_15px_50px_rgba(29,78,216,0.06)] space-y-8 relative overflow-hidden">
            {/* Subtle corner decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Join the Decentralized Travel Movement</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-dark-900 tracking-tight font-display leading-tight">
                Ready to Experience <span className="bg-gradient-to-r from-primary-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">Risk-Free Travel?</span>
              </h2>

              <p className="text-dark-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-sans">
                Whether you&apos;re an adventurous traveler seeking authentic local secrets or an expert guide ready to earn 90% direct payouts, GuideBloc. protects every journey.
              </p>

              {/* Value trust badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-dark-600">
                <div className="flex items-center gap-1.5 bg-white/80 border border-dark-100 px-3.5 py-1.5 rounded-full shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Zero Escrow Counterparty Risk</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 border border-dark-100 px-3.5 py-1.5 rounded-full shadow-xs">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Fast Avalanche Stablecoin Payouts</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 border border-dark-100 px-3.5 py-1.5 rounded-full shadow-xs">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span>100% ID-Verified Guides</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
              <Link 
                href="/explore" 
                className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white font-bold py-4 px-9 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Local Tours</span>
              </Link>

              <Link 
                href="/auth/register?role=guide" 
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-dark-900 font-bold py-4 px-9 rounded-2xl border border-dark-200/90 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <Users className="w-4 h-4 text-primary" />
                <span>Become a Tour Guide</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
      <AIChatAssistant initialQuery={aiQuery} onCloseInput={() => setAiQuery("")} />
      </div>
    </div>
  );
}
