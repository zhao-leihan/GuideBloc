import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, Code2, Coins, TrendingUp, Terminal, 
  Bot, CheckCircle2, Mail, ShieldCheck, ArrowRight
} from "lucide-react";

export const metadata = {
  title: "Our Team & Autonomous AI C-Suite — GuideBloc",
  description: "Meet the minds behind GuideBloc: Founder & CEO Rayhan Aziel Abbrar, Software Engineer 0xAnakMommy (Rayhan Young), and our Autonomous AI Executive Agents (CFO & CMO).",
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-36 pb-28 md:pb-36 overflow-hidden bg-dark-950">
        <div className="absolute inset-0 bg-[url('/assets/hero/hero-fuji.webp')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/95 to-dark-950" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 text-primary-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Human Visionaries + Autonomous AI Execution
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-display">
            Meet the GuideBloc Team
          </h1>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto leading-relaxed">
            Bridging real-world global exploration with on-chain financial technology and autonomous algorithmic executive intelligence.
          </p>
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" className="fill-dark-50 dark:fill-[#0b0f17]"></path>
          </svg>
        </div>
      </section>

      {/* Human Leadership & Core Engineering */}
      <section className="py-20 md:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Core Builders
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-dark-900 font-display">
            Leadership & Engineering
          </h2>
          <p className="text-dark-500 text-sm sm:text-base max-w-xl mx-auto">
            Directing protocol architecture, global marketplace strategy, and smart contract security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Founder & CEO */}
          <div className="bg-white rounded-3xl p-8 border border-dark-200 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />
            <div>
              <div className="flex items-center gap-5 mb-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md flex-shrink-0 bg-dark-200">
                  <Image
                    src="/assets/rayhan.jpg"
                    alt="Rayhan Aziel Abbrar"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
                    Founder & CEO
                  </span>
                  <h3 className="text-2xl font-black text-dark-900 font-display">
                    Rayhan Aziel Abbrar
                  </h3>
                  <p className="text-xs text-dark-500 font-medium">
                    Founder & Chief Executive Officer
                  </p>
                </div>
              </div>

              <p className="text-dark-600 text-sm leading-relaxed mb-6">
                Visionary and platform leader spearheading GuideBloc&apos;s global travel commerce standard. Focused on decentralizing travel economies, empowering local guides with instant settlement, and removing exploitative platform intermediaries.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {["Product Strategy", "Decentralized Commerce", "Platform Architecture", "Global Expansion"].map((tag) => (
                  <span key={tag} className="text-xs font-semibold bg-dark-50 border border-dark-200 text-dark-700 px-3 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-dark-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Executive Leadership
              </span>
              <a
                href="mailto:rayhan@guidebloc.com"
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" /> rayhan@guidebloc.com
              </a>
            </div>
          </div>

          {/* Software Engineer */}
          <div className="bg-white rounded-3xl p-8 border border-dark-200 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />
            <div>
              <div className="flex items-center gap-5 mb-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-md flex-shrink-0 bg-gradient-to-br from-indigo-900 to-dark-900 flex items-center justify-center text-indigo-400">
                  <Terminal className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
                    Software Engineer
                  </span>
                  <h3 className="text-2xl font-black text-dark-900 font-display">
                    0xAnakMommy
                  </h3>
                  <p className="text-xs text-dark-500 font-mono">
                    (Rayhan Young) • Core Systems Engineer
                  </p>
                </div>
              </div>

              <p className="text-dark-600 text-sm leading-relaxed mb-6">
                Core protocol software engineer developing GuideBloc&apos;s smart contract escrow engine on Avalanche C-Chain, EIP-712 pre-trip agreement signatures, gasless sponsored paymaster relayers, and high-performance Web3 infrastructure.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {["Smart Contracts", "Avalanche C-Chain", "EIP-712 Cryptography", "Fullstack Systems"].map((tag) => (
                  <span key={tag} className="text-xs font-semibold bg-dark-50 border border-dark-200 text-dark-700 px-3 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-dark-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> Protocol Engineering
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                0xAnakMommy.eth
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Autonomous AI Executive Team */}
      <section className="py-20 md:py-28 bg-dark-950 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Autonomous Intelligence Layer
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display">
              Autonomous AI Executive Agents
            </h2>
            <p className="text-dark-300 text-sm sm:text-base max-w-xl mx-auto">
              Our algorithmic C-Suite executes liquidity management, on-chain risk arbitration, and global marketing curation 24/7 without delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* AI CFO */}
            <div className="bg-dark-900/90 border border-dark-800 rounded-3xl p-8 hover:border-emerald-500/50 shadow-2xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Coins className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        AI Executive
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
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

                <div className="space-y-3 mb-6 bg-dark-950/60 p-4 rounded-2xl border border-dark-800 text-xs text-dark-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Real-Time Escrow Solvency:</strong> Monitors locked USDC/USDT balances to prevent liquidity shortfalls.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>24-Hour Time-Lock Automation:</strong> Programmatically triggers un-disputed escrow releases.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Predictive Gas Optimization:</strong> Algorithmic gas metering on Avalanche C-Chain.</span>
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
            <div className="bg-dark-900/90 border border-dark-800 rounded-3xl p-8 hover:border-violet-500/50 shadow-2xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/15 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-lg">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/30">
                        AI Executive
                      </span>
                      <span className="text-[11px] font-semibold text-violet-400 flex items-center gap-1">
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

                <div className="space-y-3 mb-6 bg-dark-950/60 p-4 rounded-2xl border border-dark-800 text-xs text-dark-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Japan Tourism Trend Sensing:</strong> Analyzes Tokyo, Kyoto, Fuji, and Osaka interest in real time.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>AI Travel Concierge Integration:</strong> Matches tourists with vetted local Japanese guides.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Community Sentiment Audit:</strong> Evaluates traveler satisfaction scores to promote top hosts.</span>
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

      {/* Explore CTA */}
      <section className="py-16 bg-white border-t border-dark-200/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-dark-900 font-display">
            Explore GuideBloc Experiences
          </h2>
          <p className="text-dark-500 text-sm max-w-xl mx-auto leading-relaxed">
            Discover vetted local tours across Japan or read more about our vision for decentralized travel commerce.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/about" className="btn-outline py-2.5 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
              Read About Us <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/explore" className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
              Browse Tours <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
