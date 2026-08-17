"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User, Wallet, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const user = session?.user as any;
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (session) {
      if (user?.avatar && !user.avatar.startsWith("data:")) {
        setAvatar(user.avatar);
      }
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.avatar) {
            setAvatar(data.avatar);
          }
        })
        .catch((err) => console.error("Error loading navbar avatar:", err));
    } else {
      setAvatar(null);
    }
  }, [session, user?.avatar]);

  const bleedPages = ["/", "/about", "/how-it-works", "/explore", "/freelancer", "/team", "/help-center", "/safety", "/terms-of-service", "/privacy-policy", "/cookie-policy"];
  const shouldShowSpacer = !bleedPages.includes(pathname);

  const navLinks = [
    { label: "Explore", href: "/explore" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Freelancer", href: "/freelancer" },
  ];

  return (
    <>
      <nav className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full border flex items-center justify-between px-6 backdrop-blur-md",
        (scrolled || shouldShowSpacer) 
          ? "top-3 w-[92%] max-w-5xl bg-dark-950/95 border-white/15 shadow-2xl py-2" 
          : "top-5 w-[95%] max-w-6xl bg-dark-950/40 border-white/10 shadow-none py-3.5"
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center group py-0.5">
          <img 
            src="https://www.explomate.com/assets/navbaronly.png" 
            alt="Explomate Logo" 
            className="h-8 md:h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>

        {/* Central Menu Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full border border-white/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300",
                  isActive 
                    ? "text-white bg-primary shadow-lg shadow-primary/20" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Action Menu */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <Link
                href={user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings"}
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 border border-white/5 rounded-full flex items-center gap-2 text-xs font-semibold transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all pr-3.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-white/90">{user?.name?.split(" ")[0]}</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 bg-dark-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 py-2 z-50 text-white"
                    >
                      <div className="px-4 py-2.5 border-b border-white/5">
                        <p className="text-xs font-bold text-white">{user?.name}</p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{user?.email}</p>
                      </div>
                      
                      <Link
                        href={user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings"}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      
                      <Link
                        href={user?.role === "GUIDE" ? "/dashboard/guide/messages" : "/dashboard/tourist/messages"}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4" /> Messages
                      </Link>
                      
                      <Link
                        href={user?.role === "GUIDE" ? "/dashboard/guide/wallet" : "/dashboard/tourist/wallet"}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Wallet className="w-4 h-4" /> Wallet
                      </Link>
                      
                      <hr className="my-1.5 border-white/5" />
                      
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 w-full text-left hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className="text-white/80 hover:text-white px-4 py-2 rounded-full text-xs font-semibold transition-colors"
              >
                Log In
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-white text-dark-950 hover:bg-white/90 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md shadow-white/5"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Action & Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="absolute top-full left-0 right-0 mt-2.5 bg-dark-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-2xl z-50"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block text-xs font-semibold py-2.5 px-4 rounded-xl transition-all",
                      isActive 
                        ? "text-white bg-primary" 
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <hr className="border-white/5" />
              {session ? (
                <>
                  <Link 
                    href={user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "GUIDE" ? "/dashboard/guide/overview" : "/dashboard/tourist/bookings"} 
                    className="block text-xs font-semibold py-2.5 px-4 rounded-xl text-white hover:bg-white/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }} 
                    className="block w-full text-left text-xs font-semibold py-2.5 px-4 rounded-xl text-red-400 hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link 
                    href="/auth/login" 
                    className="text-center text-xs font-semibold py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="text-center text-xs font-bold py-2.5 rounded-xl bg-white text-dark-950"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer to prevent header overlaying layout */}
      {shouldShowSpacer && <div className="h-24 w-full" />}
    </>
  );
}
