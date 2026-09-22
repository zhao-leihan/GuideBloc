import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import Link from "next/link";
import { 
  Globe, Heart, Shield, Zap, Scale, Sparkles, 
  Code2, Cpu, LineChart, ShieldCheck, Coins, 
  TrendingUp, Terminal, Bot, ArrowUpRight, Compass,
  CheckCircle2, Mail, ExternalLink
} from "lucide-react";
import { GlobeIcon, LockClosedIcon } from "@radix-ui/react-icons";

export const metadata = {
  title: "About Us — GuideBloc",
  description: "Learn about GuideBloc, our Founder & CEO Rayhan Aziel Abbrar, Software Engineer 0xAnakMommy, and our autonomous AI Executive C-Suite (CFO & CMO).",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-28 md:pb-36 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('/assets/hero/hero-fuji.webp')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/95 to-dark-950" />
        
        <div className="relative max-w-5xl mx-auto px-4 text-center z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>The Modern Standard for Global Travel Commerce</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white font-display tracking-tight leading-tight">
            About GuideBloc.
          </h1>

          <p className="text-lg sm:text-xl text-dark-300 max-w-3xl mx-auto leading-relaxed font-sans">
            Where authentic exploration meets Web3 financial technology. Eliminating booking scams and cross-border payment bottlenecks through automated escrow, direct guide settlements, and autonomous AI agents.
          </p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" className="fill-dark-50 dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      {/* Mission & Purpose Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display mb-6">
                Fair Commerce for Travelers & Local Guides
              </h2>
              <p className="text-dark-600 leading-relaxed mb-5 text-base sm:text-lg">
                Traditional online travel agencies (OTAs) charge predatory 25% to 40% commissions and hold local guide earnings for weeks through slow cross-border wire transfers. Travelers risk cancellation scams, while local guides struggle with platform delays.
              </p>
              <p className="text-dark-600 leading-relaxed text-base sm:text-lg">
                GuideBloc reimagines travel commerce by replacing middlemen with decentralized smart contract escrows on Avalanche C-Chain. With instant USDT/USDC settlement, EIP-712 pre-trip cryptographic signatures, and a Dynamic QR mutual handshake upon completion, funds release directly to local guides the second a tour finishes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: Globe, title: "Japan & Beyond", desc: "Top destinations", gradient: "from-primary/15 via-primary/5 to-transparent", color: "bg-primary/10 text-primary border-primary/20" },
                { icon: ShieldCheck, title: "100%", desc: "Smart contract escrow", gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent", color: "bg-emerald-50 text-emerald-600 border-emerald-200/60" },
                { icon: Zap, title: "0 Delay", desc: "Instant crypto payouts", gradient: "from-amber-500/15 via-amber-500/5 to-transparent", color: "bg-amber-50 text-amber-600 border-amber-200/60" },
                { icon: Scale, title: "90% Net", desc: "Kept by local guides", gradient: "from-rose-500/15 via-rose-500/5 to-transparent", color: "bg-rose-50 text-rose-600 border-rose-200/60" },
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

      {/* Leadership & Engineering Section */}
      <section className="py-20 md:py-28 bg-white border-y border-dark-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Core Team & Architects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Leadership & Engineering
            </h2>
            <p className="text-dark-500 text-base sm:text-lg leading-relaxed">
              The visionaries and protocol builders engineering decentralized travel infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Founder & CEO: Rayhan Aziel Abbrar */}
            <div className="group relative bg-dark-50/70 hover:bg-white rounded-3xl p-8 border border-dark-200 hover:border-primary/50 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300 bg-dark-200">
                    <Image
                      src="/assets/rayhan.jpeg"
                      alt="Rayhan Aziel Abbrar"
                      fill
                      unoptimized
                      priority
                      className="object-cover object-top"
                    />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5">
                      Founder & CEO
                    </span>
                    <h3 className="text-2xl font-black text-dark-900 font-display">
                      Rayhan Aziel Abbrar
                    </h3>
                    <p className="text-xs text-dark-500 font-medium mt-0.5">
                      Founder & Chief Executive Officer
                    </p>
                  </div>
                </div>

                <p className="text-dark-600 text-sm leading-relaxed mb-6">
                  Spearheading GuideBloc&apos;s product strategy and global decentralized commerce standard. Driven by a mission to restore financial sovereignty to local tour guides and establish cryptographic trust for international travelers.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {["Product Vision", "Global Web3 Strategy", "Travel Commerce Architecture", "Community Growth"].map((skill) => (
                    <span key={skill} className="text-xs font-semibold bg-white border border-dark-200 text-dark-700 px-3 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dark-200/80 flex items-center justify-between">
                <span className="text-xs text-dark-500 flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Executive Leadership
                </span>
                <a
                  href="mailto:rayhan@guidebloc.com"
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" /> rayhan@guidebloc.com
                </a>
              </div>
            </div>

            {/* Software Engineer: 0xAnakMommy (Rayhan Young) */}
            <div className="group relative bg-dark-50/70 hover:bg-white rounded-3xl p-8 border border-dark-200 hover:border-indigo-500/50 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-indigo-500/15 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              
              <div>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-indigo-900 to-dark-900 flex items-center justify-center text-indigo-400">
                    <Terminal className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5">
                      Software Engineer
                    </span>
                    <h3 className="text-2xl font-black text-dark-900 font-display">
                      0xAnakMommy
                    </h3>
                    <p className="text-xs text-dark-500 font-mono mt-0.5">
                      (Rayhan Young) • Core Systems Engineer
                    </p>
                  </div>
                </div>

                <p className="text-dark-600 text-sm leading-relaxed mb-6">
                  Core architect designing GuideBloc&apos;s smart contract escrow engine on Avalanche C-Chain, EIP-712 pre-trip typed data verification protocols, gasless sponsored relayer transactions, and robust Next.js backend infrastructure.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {["Smart Contract Security", "Avalanche C-Chain", "EIP-712 Cryptography", "Fullstack Systems"].map((skill) => (
                    <span key={skill} className="text-xs font-semibold bg-white border border-dark-200 text-dark-700 px-3 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dark-200/80 flex items-center justify-between">
                <span className="text-xs text-dark-500 flex items-center gap-1.5 font-semibold">
                  <Code2 className="w-4 h-4 text-indigo-600" /> Protocol Engineering
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  0xAnakMommy.eth
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Autonomous AI Executive Team Section */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-dark-950 text-white">
        <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autonomous Machine Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-display">
              Autonomous AI Executive Agents
            </h2>
            <p className="text-dark-300 text-base sm:text-lg leading-relaxed">
              Operating 24/7 without fatigue. Our algorithmic C-Suite executes high-stakes financial solvency, on-chain risk arbitration, and global market curation at machine speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

            {/* AI CFO */}
            <div className="relative rounded-3xl p-8 bg-dark-900/90 border border-dark-800 hover:border-emerald-500/50 shadow-2xl transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-500/20 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                    <Coins className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                        AI Executive
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Online 24/7
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white font-display mt-1">
                      AI Agent — CFO
                    </h3>
                    <p className="text-xs text-dark-400 font-medium">
                      Chief Financial Officer • Automated Treasury & Escrow Solvency
                    </p>
                  </div>
                </div>

                <p className="text-dark-300 text-sm leading-relaxed mb-6">
                  Governs real-time protocol solvency across Avalanche C-Chain. Continuously audits smart contract balances, calculates dynamic relayer gas provisions, executes the 24-hour time-lock fallback engine, and maintains 100% reserve verification.
                </p>

                <div className="space-y-3 mb-6 bg-dark-950/60 p-4 rounded-2xl border border-dark-800">
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Real-Time Escrow Solvency:</strong> Monitors locked USDC/USDT to ensure zero liquidity shortfall.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>24-Hour Time-Lock Automation:</strong> Programmatically triggers un-disputed escrow releases.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Predictive Gas Optimization:</strong> Algorithmic gas metering to protect guides from network spikes.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-xs text-dark-400">
                <span className="font-mono text-emerald-400">Avalanche C-Chain Native</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                  Zero Human Delay
                </span>
              </div>
            </div>

            {/* AI CMO */}
            <div className="relative rounded-3xl p-8 bg-dark-900/90 border border-dark-800 hover:border-violet-500/50 shadow-2xl transition-all duration-300 group overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-violet-500/20 via-violet-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full">
                        AI Executive
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                        Active Sensing
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white font-display mt-1">
                      AI Agent — CMO
                    </h3>
                    <p className="text-xs text-dark-400 font-medium">
                      Chief Marketing Officer • Global Intelligence & Tour Curation
                    </p>
                  </div>
                </div>

                <p className="text-dark-300 text-sm leading-relaxed mb-6">
                  Orchestrates global travel demand sensing with emphasis on Japan and premier destinations. Continuously synthesizes traveler feedback, dynamically curates high-performing local tours, and personalizes AI concierge recommendations.
                </p>

                <div className="space-y-3 mb-6 bg-dark-950/60 p-4 rounded-2xl border border-dark-800">
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Japan Tourism Trend Sensing:</strong> Analyzes Tokyo, Kyoto, Fuji, and Osaka seasonal interest in real time.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>AI Travel Concierge Integration:</strong> Feeds semantic insights to match tourists with vetted local guides.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Community Sentiment Audit:</strong> Evaluates traveler satisfaction scores to promote the best local hosts.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-xs text-dark-400">
                <span className="font-mono text-violet-400">Hyper-Targeted Global Outreach</span>
                <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full font-bold">
                  Autonomous Marketing
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 md:py-28 bg-white border-t border-dark-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Scale className="w-3.5 h-3.5 text-secondary" />
              <span>Core Principles</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark-900 tracking-tight font-display">
              Built on Trust & Modern Tech
            </h2>
            <p className="text-dark-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-3">
              Designed for travelers seeking authentic adventures and guides seeking economic freedom.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                Icon: GlobeIcon, 
                title: "Authentic Cultural Depth", 
                desc: "Real local guides sharing their neighborhoods, heritage, and insider secrets with worldwide explorers.",
                gradient: "from-primary/15 via-primary/5 to-transparent",
                color: "bg-primary/10 text-primary border border-primary/20"
              },
              { 
                Icon: LockClosedIcon, 
                title: "Cryptographic Protection", 
                desc: "EIP-712 pre-trip agreements and automated smart contract escrow eliminate wire fraud and payment disputes.",
                gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
                color: "bg-blue-50 text-blue-600 border border-blue-200/60"
              },
              { 
                Icon: Scale, 
                title: "Equitable Economics", 
                desc: "A lean 10% platform fee means local tour guides retain 90% of their earnings with instant zero-delay settlement.",
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

          {/* CTA Banner */}
          <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 border border-dark-800 text-white text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-radial from-primary/15 via-transparent to-transparent pointer-events-none" />
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight">
              Ready to Experience Global Travel Reimagined?
            </h3>
            <p className="text-dark-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Explore authentic local tours in Japan or apply as a vetted tour guide to receive instant USDC payouts.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/explore"
                className="btn-primary py-3.5 px-7 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Explore Tours
              </Link>
              <Link
                href="/freelancer"
                className="btn-outline py-3.5 px-7 rounded-2xl font-bold text-sm border-white/20 text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
              >
                Become a Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
