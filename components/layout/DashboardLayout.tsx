"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Calendar, MessageSquare, Wallet,
  Settings, Star, TrendingUp, PlusCircle, FileText,
  Compass, User, CreditCard, Zap, BarChart3, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "guide" | "tourist" | "admin";
}

const guideLinks = [
  { href: "/dashboard/guide/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/guide/gigs", label: "My Gigs", icon: FileText },
  { href: "/dashboard/guide/gigs/create", label: "Create Gig", icon: PlusCircle },
  { href: "/dashboard/guide/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/guide/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/guide/earnings", label: "Earnings", icon: TrendingUp },
  { href: "/dashboard/guide/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/guide/profile", label: "Profile", icon: User },
];

const touristLinks = [
  { href: "/dashboard/tourist/bookings", label: "My Bookings", icon: Calendar },
  { href: "/dashboard/tourist/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/tourist/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/tourist/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
];

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [warnings, setWarnings] = useState<any[]>([]);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.warnings) {
            setWarnings(data.warnings);
          }

          // Check if profile is incomplete (missing country or bio)
          if (role !== "admin") {
            const profilePage = role === "guide" ? "/dashboard/guide/profile" : "/dashboard/tourist/profile";
            const isIncomplete = !data.country || !data.bio;

            if (isIncomplete) {
              setIsProfileIncomplete(true);
              if (pathname !== profilePage) {
                toast.error("Please complete your profile details (Country and Bio) first!");
                router.replace(profilePage);
              }
            } else {
              setIsProfileIncomplete(false);
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [session, pathname, router, role]);

  if (user?.isBlocked) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24">
          <div className="card p-8 text-center flex flex-col items-center gap-6 shadow-xl border border-dark-100 rounded-2xl bg-white animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-red-500 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-red-650">Account Suspended</h2>
              <p className="text-sm text-dark-500 leading-relaxed font-semibold">
                This account has been blocked by the admin moderation team.
              </p>
              <p className="text-xs text-dark-400">
                You have been suspended for violating our platform code of conduct or terms of service. If you wish to appeal this decision, please reach out to system administration.
              </p>
            </div>
            <div className="w-full border-t border-dark-100 pt-4 flex flex-col gap-2">
              <Link href="/" className="btn-primary py-2.5 text-xs font-semibold bg-dark-700 hover:bg-dark-800">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const links = isProfileIncomplete 
    ? (role === "guide" ? [guideLinks.find(l => l.href.includes("profile"))] : [touristLinks.find(l => l.href.includes("profile"))]).filter(Boolean) as typeof guideLinks
    : (role === "guide" ? guideLinks : role === "admin" ? adminLinks : touristLinks);
  const title = role === "guide" ? "Guide Dashboard" : role === "admin" ? "Admin Panel" : "Tourist Dashboard";

  if (role === "guide" && user?.guideStatus === "PENDING") {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24">
          <div className="card p-8 text-center flex flex-col items-center gap-6 shadow-xl border border-dark-100 rounded-2xl bg-white">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-dark-900">Application Under Review</h2>
              <p className="text-sm text-dark-500 leading-relaxed">
                Hi <span className="font-semibold text-dark-800">{user?.name}</span>, thank you for registering as a Tour Guide on Explomate!
              </p>
              <p className="text-xs text-dark-400">
                Your submitted certification and details are currently being verified by our administrator. You will be granted full dashboard access once approved.
              </p>
            </div>
            <div className="w-full border-t border-dark-100 pt-4 flex flex-col gap-2">
              <Link href="/" className="btn-primary py-2.5 text-xs font-semibold">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "guide" && user?.guideStatus === "REJECTED") {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24">
          <div className="card p-8 text-center flex flex-col items-center gap-6 shadow-xl border border-dark-100 rounded-2xl bg-white">
            <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-danger">Application Rejected</h2>
              <p className="text-sm text-dark-500 leading-relaxed">
                Hi <span className="font-semibold text-dark-800">{user?.name}</span>, we regret to inform you that your guide application has been rejected.
              </p>
              <p className="text-xs text-dark-400">
                If you believe this was an error, please contact our support team to re-submit your credentials.
              </p>
            </div>
            <div className="w-full border-t border-dark-100 pt-4 flex flex-col gap-2">
              <Link href="/" className="btn-primary py-2.5 text-xs font-semibold">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 card p-4">
              <h2 className="font-display font-bold text-dark-900 px-3 mb-4">{title}</h2>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary dark:bg-primary dark:text-white font-bold shadow-xs"
                          : "text-dark-600 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Mobile Sub-Navigation Bar */}
            <div className="lg:hidden w-full overflow-x-auto pb-1.5 scrollbar-none border-b border-dark-200/50">
              <div className="flex gap-2 min-w-max px-0.5 py-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm",
                        isActive
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-dark-200 text-dark-600 hover:bg-dark-50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="space-y-3 mb-6 animate-in slide-in-from-top-4 duration-300">
                {warnings.map((warn) => (
                  <div key={warn.id} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Account Warning Notice</h4>
                      <p className="text-xs text-amber-850 mt-1 leading-relaxed font-semibold">{warn.reason}</p>
                      <span className="text-[10px] text-amber-600 font-bold block mt-1.5">
                        Received on {new Date(warn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
