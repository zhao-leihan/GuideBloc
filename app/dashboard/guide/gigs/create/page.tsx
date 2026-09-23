"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import toast from "react-hot-toast";
import { 
  Rocket, Info, Image as ImageIcon, MapPin, DollarSign, Clock, Users, X, 
  FileText, Globe, Loader2, AlertCircle, Calendar, CheckCircle, XCircle, 
  Languages as LanguagesIcon, Sparkles, Plus, Layers, Percent, Tag, Trash2, 
  CheckCircle2, ArrowRight, ArrowLeft, Eye, Compass, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CONFIG } from "@/lib/config";
import PaymentModal from "@/components/payment/PaymentModal";
import { COUNTRIES as countries } from "@/lib/countries";

interface TourPackageItem {
  id: string;
  name: string;
  priceUSD: number | string;
  description: string;
  includes: string[];
  excludes: string[];
}

interface TourPromoItem {
  id: string;
  title: string;
  discountPercent: number;
  daysOfWeek: string[];
  isActive: boolean;
}

const categories = [
  "Adventure",
  "Cultural",
  "Food",
  "Nature",
  "City",
  "Water",
  "Historical",
  "Nightlife",
  "Photography",
  "Wellness",
];

const PRESET_LANGUAGES = [
  "English",
  "Indonesian",
  "Japanese",
  "Mandarin",
  "Spanish",
  "French",
  "German",
  "Korean",
  "Arabic",
  "Italian",
  "Russian",
  "Thai",
  "Vietnamese",
];

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MORNING_TIMES = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"];
const AFTERNOON_TIMES = ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
const NIGHT_TIMES = ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"];
const ALL_TIMES = [...MORNING_TIMES, ...AFTERNOON_TIMES, ...NIGHT_TIMES];

const WIZARD_STEPS = [
  { step: 1, title: "Overview", subtitle: "Title & Location", icon: Compass },
  { step: 2, title: "Logistics", subtitle: "Timing & Schedule", icon: Calendar },
  { step: 3, title: "Packages", subtitle: "Pricing & Tiers", icon: Layers },
  { step: 4, title: "Media", subtitle: "Photos Upload", icon: ImageIcon },
  { step: 5, title: "Review", subtitle: "Preview & Publish", icon: Eye },
];

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const hasWallet = !!user?.walletAddress;

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [boostAlgorithm, setBoostAlgorithm] = useState(false);
  const [pendingBoostGigId, setPendingBoostGigId] = useState<string | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    durationHours: "4",
    maxGroupSize: "8",
    location: "",
    meetingPoint: "",
    category: "Adventure",
    country: "Indonesia",
    description: "",
  });

  const [availableDays, setAvailableDays] = useState<string[]>(ALL_DAYS);
  const [availableTimes, setAvailableTimes] = useState<string[]>(["08:00 AM", "01:00 PM", "06:00 PM"]);
  const [customTimeInput, setCustomTimeInput] = useState("");

  // Packages State
  const [packages, setPackages] = useState<TourPackageItem[]>([
    {
      id: "pkg-1",
      name: "Basic Tour Package",
      priceUSD: 45,
      description: "Standard guided walking experience with local guide",
      includes: ["Licensed Local Tour Guide", "Route & Direction Assistance", "Bottled Mineral Water"],
      excludes: ["Personal Shopping Expenses", "Alcoholic Beverages", "Hotel Pick-up & Drop-off"],
    },
  ]);
  const [packagePerkInput, setPackagePerkInput] = useState<Record<number, string>>({});
  const [packageExcludeInput, setPackageExcludeInput] = useState<Record<number, string>>({});

  // Promos State
  const [promos, setPromos] = useState<TourPromoItem[]>([]);

  // Languages State
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English", "Indonesian"]);
  const [customLangInput, setCustomLangInput] = useState("");

  // Images State
  const [images, setImages] = useState<string[]>([]);

  // Step Validation Logic
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) {
          toast.error("Please enter a tour title");
          return false;
        }
        if (!formData.location.trim()) {
          toast.error("Please enter the specific location or city");
          return false;
        }
        return true;

      case 2:
        const dur = parseInt(formData.durationHours);
        if (isNaN(dur) || dur < 1) {
          toast.error("Please enter a valid tour duration (at least 1 hour)");
          return false;
        }
        const grp = parseInt(formData.maxGroupSize);
        if (isNaN(grp) || grp < 1) {
          toast.error("Please enter a valid maximum group size (at least 1 person)");
          return false;
        }
        if (availableDays.length === 0) {
          toast.error("Please select at least 1 available tour day");
          return false;
        }
        if (availableTimes.length === 0) {
          toast.error("Please select at least 1 departure time slot");
          return false;
        }
        if (selectedLanguages.length === 0) {
          toast.error("Please select at least 1 spoken language");
          return false;
        }
        if (!formData.description.trim() || formData.description.trim().length < 20) {
          toast.error("Please provide a detailed tour description (minimum 20 characters)");
          return false;
        }
        return true;

      case 3:
        if (packages.length === 0) {
          toast.error("Please configure at least 1 tour package");
          return false;
        }
        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i];
          if (!pkg.name.trim()) {
            toast.error(`Please provide a name for Package #${i + 1}`);
            return false;
          }
          const price = parseFloat(String(pkg.priceUSD || 0));
          if (isNaN(price) || price < 0.01) {
            toast.error(`Package #${i + 1} must have a valid price (min $0.01 USDC)`);
            return false;
          }
        }
        return true;

      case 4:
        if (images.length === 0) {
          toast.error("Please upload at least 1 photo for your tour");
          return false;
        }
        return true;

      case 5:
        return true;

      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      if (currentStep < 5) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleJumpToStep = (targetStep: number) => {
    // Allow jumping to any step that has been completed or is the current step or immediate next step if valid
    if (targetStep < currentStep || completedSteps.includes(targetStep - 1)) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Package Management Handlers
  const addPackage = () => {
    if (packages.length >= 4) {
      toast.error("Maximum 4 packages allowed per tour");
      return;
    }
    const newId = `pkg-${Date.now()}`;
    const basePrice = parseFloat(String(packages[0]?.priceUSD || 45)) || 45;
    const multiplier = packages.length === 1 ? 1.5 : packages.length === 2 ? 2.2 : 3.0;
    const tierNames = ["Standard Package", "Comfort Transit Package", "VIP All-Inclusive Package"];
    const tierInclusions = [
      ["Licensed Local Tour Guide", "Public Train / Bus Pass", "Local Food Tasting"],
      ["Licensed Local Tour Guide", "Private AC Van Transport", "Buffet Lunch / Food Tasting", "Bottled Mineral Water"],
      ["Licensed Local Tour Guide", "Private AC Van Transport", "Buffet Lunch / Food Tasting", "Temple / Museum Admission Tickets", "Hotel Pickup & Drop", "Photography Assistance"]
    ];
    const tierExclusions = [
      ["Personal Shopping Expenses", "Alcoholic Beverages", "Hotel Pick-up & Drop-off"],
      ["Personal Shopping Expenses", "Alcoholic Beverages"],
      ["Personal Shopping Expenses"]
    ];

    setPackages([
      ...packages,
      {
        id: newId,
        name: tierNames[packages.length - 1] || `Tier ${packages.length + 1} Package`,
        priceUSD: Math.round(basePrice * multiplier * 100) / 100,
        description: "Includes extended transport, meals, or attraction entry tickets",
        includes: tierInclusions[packages.length - 1] || ["Licensed Local Tour Guide", "Transportation Included"],
        excludes: tierExclusions[packages.length - 1] || ["Personal Shopping Expenses"],
      },
    ]);
    toast.success(`Package ${packages.length + 1} added!`);
  };

  const removePackage = (index: number) => {
    if (packages.length <= 1) {
      toast.error("You must have at least 1 package");
      return;
    }
    setPackages(packages.filter((_, i) => i !== index));
  };

  const updatePackageField = (index: number, field: keyof TourPackageItem, value: any) => {
    setPackages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addPackageInclude = (pkgIndex: number, customItem?: string) => {
    const perk = (customItem || packagePerkInput[pkgIndex] || "").trim();
    if (!perk) return;
    setPackages(prev => {
      const copy = [...prev];
      if (!copy[pkgIndex].includes) copy[pkgIndex].includes = [];
      if (!copy[pkgIndex].includes.includes(perk)) {
        copy[pkgIndex].includes = [...copy[pkgIndex].includes, perk];
      }
      return copy;
    });
    if (!customItem) {
      setPackagePerkInput(prev => ({ ...prev, [pkgIndex]: "" }));
    }
  };

  const removePackageInclude = (pkgIndex: number, includeIndex: number) => {
    setPackages(prev => {
      const copy = [...prev];
      copy[pkgIndex].includes = copy[pkgIndex].includes.filter((_, i) => i !== includeIndex);
      return copy;
    });
  };

  const addPackageExclude = (pkgIndex: number, customItem?: string) => {
    const item = (customItem || packageExcludeInput[pkgIndex] || "").trim();
    if (!item) return;
    setPackages(prev => {
      const copy = [...prev];
      if (!copy[pkgIndex].excludes) copy[pkgIndex].excludes = [];
      if (!copy[pkgIndex].excludes.includes(item)) {
        copy[pkgIndex].excludes = [...copy[pkgIndex].excludes, item];
      }
      return copy;
    });
    if (!customItem) {
      setPackageExcludeInput(prev => ({ ...prev, [pkgIndex]: "" }));
    }
  };

  const removePackageExclude = (pkgIndex: number, excludeIndex: number) => {
    setPackages(prev => {
      const copy = [...prev];
      if (copy[pkgIndex].excludes) {
        copy[pkgIndex].excludes = copy[pkgIndex].excludes.filter((_, i) => i !== excludeIndex);
      }
      return copy;
    });
  };

  // Promo Handlers
  const addPromo = () => {
    if (promos.length >= 3) {
      toast.error("Maximum 3 active promo rules allowed");
      return;
    }
    setPromos([
      ...promos,
      {
        id: `promo-${Date.now()}`,
        title: "Special Day Discount",
        discountPercent: 15,
        daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        isActive: true,
      },
    ]);
    toast.success("Promo rule added!");
  };

  const removePromo = (index: number) => {
    setPromos(promos.filter((_, i) => i !== index));
  };

  const updatePromoField = (index: number, field: keyof TourPromoItem, value: any) => {
    setPromos(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const togglePromoDay = (promoIndex: number, day: string) => {
    setPromos(prev => {
      const copy = [...prev];
      const days = copy[promoIndex].daysOfWeek;
      if (days.includes(day)) {
        if (days.length > 1) {
          copy[promoIndex].daysOfWeek = days.filter(d => d !== day);
        }
      } else {
        copy[promoIndex].daysOfWeek = [...days, day];
      }
      return copy;
    });
  };

  // Spoken Languages Handlers
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      } else {
        toast.error("Please keep at least 1 spoken language");
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const addCustomLanguage = () => {
    if (!customLangInput.trim()) return;
    const lang = customLangInput.trim();
    if (!selectedLanguages.includes(lang)) {
      setSelectedLanguages([...selectedLanguages, lang]);
      setCustomLangInput("");
      toast.success(`Added language: ${lang}`);
    } else {
      toast.error("Language is already selected");
    }
  };

  // Departure Time Handlers
  const handleAddCustomTime = () => {
    if (!customTimeInput) return;
    let [h, m] = customTimeInput.split(":").map(Number);
    const modifier = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${modifier}`;

    if (!availableTimes.includes(formatted)) {
      setAvailableTimes([...availableTimes, formatted]);
      setCustomTimeInput("");
      toast.success(`Added custom departure time: ${formatted}`);
    } else {
      toast.error("This time slot is already added");
    }
  };

  // Image Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      if (images.length + filesArray.length > 5) {
        toast.error("You can upload a maximum of 5 images");
        return;
      }

      filesArray.forEach(async (file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds the 10MB size limit`);
          return;
        }

        try {
          const compressed = await compressImage(file);
          setImages((prev) => [...prev, compressed]);
        } catch (err) {
          console.error("Image compression error:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              setImages((prev) => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Final Publish Handler
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate all steps before submission
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    try {
      setIsCreating(true);
      toast.loading("Publishing your tour gig...", { id: "create-gig" });

      const baseGuidePrice = parseFloat(String(packages[0].priceUSD)) || 0.01;
      const aggregatedIncluded = Array.from(new Set(packages.flatMap(p => p.includes || [])));
      const aggregatedExcluded = Array.from(new Set(packages.flatMap(p => p.excludes || [])));

      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          country: formData.country,
          meetingPoint: formData.meetingPoint,
          languages: selectedLanguages,
          included: aggregatedIncluded,
          excluded: aggregatedExcluded,
          durationHours: parseInt(formData.durationHours),
          maxGroupSize: parseInt(formData.maxGroupSize),
          guide_price: baseGuidePrice,
          images: images,
          benefits: aggregatedIncluded,
          availableDays,
          availableTimes,
          packages: packages.map((pkg) => {
            const parsedP = parseFloat(String(pkg.priceUSD));
            const guide_p = !isNaN(parsedP) && parsedP > 0 ? parsedP : baseGuidePrice;
            const client_p = Math.round(guide_p * 1.10 * 100) / 100;
            const fee_p = Math.round((client_p - guide_p) * 100) / 100;
            return {
              ...pkg,
              guide_price: guide_p,
              client_price: client_p,
              platform_fee: fee_p,
              priceUSD: client_p,
            };
          }),
          promos: promos.filter(p => p.isActive && p.discountPercent > 0),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create gig");
      }

      const newGig = await res.json();
      toast.success("Tour gig published successfully!", { id: "create-gig" });

      if (boostAlgorithm) {
        setPendingBoostGigId(newGig.id);
        return;
      }

      router.push("/dashboard/guide/gigs");
      
    } catch (error: any) {
      console.error("Create gig error:", error);
      toast.error(error.message || "Failed to create gig", { id: "create-gig" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBoostConfirmed = async (txHash: string, network: string) => {
    if (!pendingBoostGigId) return;
    setActivatingBoost(true);
    try {
      const res = await fetch("/api/monetization/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: pendingBoostGigId, txHash, network }),
      });
      if (res.ok) {
        toast.success("Gig published and boosted to Featured for 7 days!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Boost registration failed. You can activate it from My Gigs.");
      }
    } catch {
      toast.error("Network error activating boost.");
    } finally {
      setActivatingBoost(false);
      setPendingBoostGigId(null);
      router.push("/dashboard/guide/gigs");
    }
  };

  const handleBoostSkipped = () => {
    setPendingBoostGigId(null);
    toast.success("Gig published! You can boost it anytime from My Gigs.");
    router.push("/dashboard/guide/gigs");
  };

  return (
    <DashboardLayout role="guide">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1.5 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" /> Guide Creator Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark-900 tracking-tight font-display">
              Create New Tour Gig
            </h1>
            <p className="text-sm text-dark-500 mt-0.5">
              Follow the guided steps below to craft a professional, high-converting tour listing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/guide/gigs")}
            className="text-xs font-bold text-dark-500 hover:text-dark-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            ✕ Exit to My Gigs
          </button>
        </div>

        {/* Payout Wallet Warning Banner */}
        {!hasWallet && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Payout Wallet Required</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed font-semibold">
                You must connect a Web3 wallet (MetaMask, Coinbase Wallet, or Solflare) in the **Wallet** tab before you can publish gig listings. This ensures you can receive instant escrow payouts upon tour completion.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/guide/wallet")}
                className="mt-2 text-xs font-bold text-primary hover:underline block cursor-pointer"
              >
                Go to Wallet Setup →
              </button>
            </div>
          </div>
        )}

        {/* WIZARD STEPPER HEADER */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-dark-100 shadow-sm space-y-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.step;
              const isDone = completedSteps.includes(s.step) || s.step < currentStep;
              const canJump = isDone || s.step === currentStep;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => canJump && handleJumpToStep(s.step)}
                  disabled={!canJump}
                  className={`text-left p-2.5 sm:p-3.5 rounded-2xl transition-all relative flex flex-col justify-between ${
                    isCurrent
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/60 cursor-pointer"
                      : "bg-dark-50/70 text-dark-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? "bg-white text-primary"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-dark-200 text-dark-600"
                    }`}>
                      {isDone && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                    </span>
                    <Icon className={`w-4 h-4 hidden sm:block ${
                      isCurrent ? "text-white" : isDone ? "text-emerald-600" : "text-dark-400"
                    }`} />
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold tracking-tight truncate ${
                      isCurrent ? "text-white" : isDone ? "text-emerald-950" : "text-dark-700"
                    }`}>
                      {s.title}
                    </h4>
                    <p className={`text-[10px] hidden md:block truncate mt-0.5 ${
                      isCurrent ? "text-white/80" : isDone ? "text-emerald-700" : "text-dark-400"
                    }`}>
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-dark-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="space-y-6">

          {/* ================= STEP 1: OVERVIEW & LOCATION ================= */}
          {currentStep === 1 && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-dark-100 pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                  <Compass className="w-4 h-4" /> Step 1 of 5
                </div>
                <h2 className="text-xl font-black text-dark-900 font-display">
                  Tour Overview & Location
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  Give your tour an enticing title and specify where the experience takes place.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-dark-800 mb-1.5">
                    Tour Title *
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-dark-950 font-semibold text-base transition-all"
                    placeholder="e.g. Kyoto Golden Hour: Secret Bamboo Groves & Tea Tasting"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    autoFocus
                  />
                  <p className="text-[11px] text-dark-400 mt-1">
                    Clear, evocative titles attract up to 3x more bookings from international travelers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-primary" /> Category *
                    </label>
                    <select
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium cursor-pointer"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" /> Destination Country *
                    </label>
                    <select
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium cursor-pointer"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                    >
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5">
                      Specific Location / City *
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium"
                      placeholder="e.g. Kyoto, Japan or Ubud, Bali"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" /> Designated Meeting Point
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium"
                      placeholder="e.g. In front of Hachiko Statue, Exit 8"
                      value={formData.meetingPoint}
                      onChange={e => setFormData({...formData, meetingPoint: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: SCHEDULE & LOGISTICS ================= */}
          {currentStep === 2 && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-dark-100 pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                  <Calendar className="w-4 h-4" /> Step 2 of 5
                </div>
                <h2 className="text-xl font-black text-dark-900 font-display">
                  Schedule, Logistics & Description
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  Set how long your tour takes, group size capacity, available departure times, and languages.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" /> Duration (Hours) *
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium"
                      placeholder="4"
                      value={formData.durationHours}
                      onChange={e => setFormData({...formData, durationHours: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark-800 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" /> Max Group Size (Travelers) *
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-3.5 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 font-medium"
                      placeholder="8"
                      value={formData.maxGroupSize}
                      onChange={e => setFormData({...formData, maxGroupSize: e.target.value})}
                    />
                  </div>
                </div>

                {/* Available Days Selector */}
                <div className="space-y-2 pt-2 border-t border-dark-100">
                  <label className="block text-sm font-bold text-dark-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" /> Available Tour Days *
                  </label>
                  <p className="text-xs text-dark-500">Toggle the days of the week you host this tour:</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_DAYS.map((day) => {
                      const isSelected = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (availableDays.length > 1) {
                                setAvailableDays(availableDays.filter(d => d !== day));
                              } else {
                                toast.error("Please keep at least 1 tour day");
                              }
                            } else {
                              setAvailableDays([...availableDays, day]);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-dark-50 text-dark-600 border-dark-200 hover:border-dark-350"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Selector */}
                <div className="space-y-2 pt-2 border-t border-dark-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-dark-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" /> Departure Time Slots *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const durHours = parseFloat(formData.durationHours) || 4;
                        const durationMins = durHours * 60;
                        const selected: string[] = [];
                        let lastEnd = -1;
                        for (const time of ALL_TIMES) {
                          const [t, mod] = time.split(" ");
                          let [h, m] = t.split(":").map(Number);
                          if (mod === "PM" && h < 12) h += 12;
                          if (mod === "AM" && h === 12) h = 0;
                          const start = h * 60 + m;
                          if (lastEnd === -1 || start >= lastEnd) {
                            selected.push(time);
                            lastEnd = start + durationMins;
                          }
                        }
                        setAvailableTimes(selected);
                        toast.success("Auto-spaced time slots generated!");
                      }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      ⚡ Auto-space slots
                    </button>
                  </div>
                  <p className="text-xs text-dark-500">Select start times for tourists to book (click to toggle):</p>

                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          if (availableTimes.length > 1) {
                            setAvailableTimes(availableTimes.filter(t => t !== time));
                          } else {
                            toast.error("You must keep at least 1 time slot");
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-primary text-white border-primary shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {time}
                        <X className="w-3.5 h-3.5 hover:opacity-80" />
                      </button>
                    ))}

                    {ALL_TIMES.filter(t => !availableTimes.includes(t)).map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAvailableTimes([...availableTimes, time])}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-dark-50 text-dark-600 border-dark-200 hover:border-dark-350 cursor-pointer"
                      >
                        + {time}
                      </button>
                    ))}

                    <div className="flex items-center gap-1.5 bg-dark-50 border border-dark-200 rounded-xl px-2.5 py-1.5">
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        className="bg-transparent text-xs font-bold text-dark-800 outline-none w-16"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTime}
                        className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Overlap Notice */}
                  {(() => {
                    const durHours = parseFloat(formData.durationHours) || 4;
                    const durMins = durHours * 60;
                    const parseMins = (tStr: string) => {
                      const [t, mod] = tStr.split(" ");
                      let [h, m] = t.split(":").map(Number);
                      if (mod === "PM" && h < 12) h += 12;
                      if (mod === "AM" && h === 12) h = 0;
                      return h * 60 + m;
                    };

                    const sorted = [...availableTimes].sort((a, b) => parseMins(a) - parseMins(b));
                    const overlaps: { t1: string; t2: string; end1Str: string }[] = [];

                    for (let i = 0; i < sorted.length; i++) {
                      const s1 = parseMins(sorted[i]);
                      const e1 = s1 + durMins;
                      for (let j = i + 1; j < sorted.length; j++) {
                        const s2 = parseMins(sorted[j]);
                        if (s2 < e1) {
                          const endH = Math.floor(e1 / 60) % 24;
                          const endM = e1 % 60;
                          const mod = endH >= 12 ? "PM" : "AM";
                          const displayH = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
                          const end1Str = `${String(displayH).padStart(2, "0")}:${String(endM).padStart(2, "0")} ${mod}`;
                          overlaps.push({ t1: sorted[i], t2: sorted[j], end1Str });
                        }
                      }
                    }

                    if (overlaps.length > 0) {
                      return (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs space-y-1 mt-2">
                          <div className="font-bold text-amber-700 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>Schedule Overlap Notice ({durHours}-Hour Tour)</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            A <strong>{durHours}-hour tour</strong> starting at <strong>{overlaps[0].t1}</strong> finishes at <strong>{overlaps[0].end1Str}</strong>. The <strong>{overlaps[0].t2}</strong> departure slot overlaps while you are still hosting the previous group.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Spoken Languages Selector */}
                <div className="space-y-2 pt-2 border-t border-dark-100">
                  <label className="block text-sm font-bold text-dark-800 flex items-center gap-1.5">
                    <LanguagesIcon className="w-4 h-4 text-primary" /> Spoken Languages *
                  </label>
                  <p className="text-xs text-dark-500">Select which languages you can comfortably guide in:</p>
                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    {selectedLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border bg-primary text-white border-primary shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Globe className="w-3 h-3" />
                        {lang}
                        <X className="w-3 h-3 hover:opacity-80" />
                      </button>
                    ))}

                    {PRESET_LANGUAGES.filter(l => !selectedLanguages.includes(l)).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border bg-dark-50 text-dark-600 border-dark-200 hover:border-dark-350 cursor-pointer"
                      >
                        + {lang}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 bg-dark-50 border border-dark-200 rounded-full px-3 py-1">
                      <input
                        type="text"
                        placeholder="Other language..."
                        value={customLangInput}
                        onChange={(e) => setCustomLangInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomLanguage(); } }}
                        className="bg-transparent text-xs font-medium text-dark-800 outline-none w-24"
                      />
                      <button
                        type="button"
                        onClick={addCustomLanguage}
                        className="px-2 py-0.5 bg-primary text-white text-[11px] font-bold rounded-full hover:bg-primary-dark transition-all cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tour Description */}
                <div className="space-y-2 pt-2 border-t border-dark-100">
                  <label className="block text-sm font-bold text-dark-800 mb-1">
                    Tour Description & Highlights *
                  </label>
                  <textarea 
                    className="w-full p-4 bg-dark-50/50 border border-dark-200 rounded-2xl focus:border-primary outline-none text-dark-950 text-sm h-36 resize-none leading-relaxed"
                    placeholder="Describe the atmosphere, itinerary highlights, secret photo spots, cultural stories, and what travelers should wear or bring along..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                  <div className="flex justify-between text-[11px] text-dark-400">
                    <span>Minimum 20 characters</span>
                    <span>{formData.description.length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PACKAGES & PRICING ================= */}
          {currentStep === 3 && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                    <Layers className="w-4 h-4" /> Step 3 of 5
                  </div>
                  <h2 className="text-xl font-black text-dark-900 font-display">
                    Tour Packages & Tiered Pricing
                  </h2>
                  <p className="text-xs text-dark-500 mt-0.5">
                    Design up to 4 distinct package tiers with custom inclusions and transparent USDC earnings.
                  </p>
                </div>

                {packages.length < 4 && (
                  <button
                    type="button"
                    onClick={addPackage}
                    className="btn-primary text-xs flex items-center gap-1.5 py-2.5 px-4 self-start sm:self-auto cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Package ({packages.length}/4)
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {packages.map((pkg, idx) => (
                  <div 
                    key={pkg.id || idx} 
                    className="p-5 sm:p-6 rounded-3xl bg-dark-50/60 border border-dark-200 space-y-4 hover:border-primary/40 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center shadow-xs">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-black text-dark-900">
                          Package Tier {idx + 1}
                        </span>
                      </div>

                      {packages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePackage(idx)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Tier
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-7 md:col-span-8">
                        <label className="block text-xs font-bold text-dark-700 mb-1.5">
                          Package Name *
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-sm font-bold"
                          placeholder="e.g. Standard Walking Tour, Private Van VIP Package"
                          value={pkg.name}
                          onChange={(e) => updatePackageField(idx, "name", e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-5 md:col-span-4">
                        <label className="block text-xs font-bold text-dark-700 mb-1.5 truncate">
                          Take-Home Payout (USDC) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="w-full pl-8 pr-3 py-3 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-sm font-black"
                            placeholder="45.00"
                            value={pkg.priceUSD !== undefined ? pkg.priceUSD : ""}
                            onChange={(e) => updatePackageField(idx, "priceUSD", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="flex flex-wrap items-center justify-between text-xs bg-emerald-50/70 border border-emerald-500/20 p-3 rounded-2xl">
                      <span className="text-dark-700 font-medium">
                        Your Direct Payout (100%): <strong className="text-emerald-700 font-black">${(parseFloat(String(pkg.priceUSD || 0)) || 0).toFixed(2)} USDC</strong>
                      </span>
                      <span className="text-dark-600">
                        Tourist Booking Price (+10% platform escrow): <strong className="text-primary font-black">${((parseFloat(String(pkg.priceUSD || 0)) || 0) * 1.10).toFixed(2)} USDC</strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark-700 mb-1">
                        Package Summary Description
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-xs"
                        placeholder="e.g. Full guided walking tour with public transit pass, bento lunch & admission"
                        value={pkg.description}
                        onChange={(e) => updatePackageField(idx, "description", e.target.value)}
                      />
                    </div>

                    {/* Inclusions & Exclusions */}
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What's Included */}
                      <div className="p-3.5 bg-emerald-50/40 border border-emerald-500/20 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> What&apos;s Included
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {pkg.includes?.length || 0} items
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            className="flex-grow p-2 px-3 bg-white border border-dark-200 rounded-xl focus:border-emerald-500 outline-none text-dark-950 text-xs"
                            placeholder="Type inclusion & press Enter..."
                            value={packagePerkInput[idx] || ""}
                            onChange={(e) => setPackagePerkInput({ ...packagePerkInput, [idx]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addPackageInclude(idx);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => addPackageInclude(idx)}
                            className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shrink-0"
                          >
                            + Add
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-dark-500 font-medium shrink-0">Presets:</span>
                          <select
                            className="w-full text-[11px] p-1.5 bg-white border border-dark-200 rounded-lg text-dark-700 outline-none focus:border-emerald-500"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addPackageInclude(idx, e.target.value);
                                e.target.value = "";
                              }
                            }}
                          >
                            <option value="" disabled>Select a preset...</option>
                            <option value="Licensed Local Tour Guide">✓ Licensed Local Tour Guide</option>
                            <option value="Public Train / Bus Transit Pass">✓ Public Train / Bus Transit Pass</option>
                            <option value="Private AC Van Transport">✓ Private AC Van Transport</option>
                            <option value="Local Food Tasting / Lunch">✓ Local Food Tasting / Lunch</option>
                            <option value="Temple / Museum Entry Tickets">✓ Temple / Museum Entry Tickets</option>
                            <option value="Bottled Mineral Water">✓ Bottled Mineral Water</option>
                            <option value="Hotel Pickup & Drop-off">✓ Hotel Pickup & Drop-off</option>
                            <option value="Photography Assistance">✓ Photography Assistance</option>
                          </select>
                        </div>

                        {pkg.includes && pkg.includes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {pkg.includes.map((perk, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center gap-1 text-[11px] bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[150px]">{perk}</span>
                                <button
                                  type="button"
                                  onClick={() => removePackageInclude(idx, pIdx)}
                                  className="text-dark-400 hover:text-red-500 font-bold ml-1 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-dark-400 italic pt-1">No inclusions added yet.</p>
                        )}
                      </div>

                      {/* What's NOT Included */}
                      <div className="p-3.5 bg-red-50/40 border border-red-500/20 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-500" /> What&apos;s NOT Included
                          </label>
                          <span className="text-[10px] font-semibold text-red-700">
                            {pkg.excludes?.length || 0} items
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            className="flex-grow p-2 px-3 bg-white border border-dark-200 rounded-xl focus:border-red-500 outline-none text-dark-950 text-xs"
                            placeholder="Type exclusion & press Enter..."
                            value={packageExcludeInput[idx] || ""}
                            onChange={(e) => setPackageExcludeInput({ ...packageExcludeInput, [idx]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addPackageExclude(idx);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => addPackageExclude(idx)}
                            className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer shrink-0"
                          >
                            + Add
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-dark-500 font-medium shrink-0">Presets:</span>
                          <select
                            className="w-full text-[11px] p-1.5 bg-white border border-dark-200 rounded-lg text-dark-700 outline-none focus:border-red-500"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addPackageExclude(idx, e.target.value);
                                e.target.value = "";
                              }
                            }}
                          >
                            <option value="" disabled>Select a preset...</option>
                            <option value="Personal Shopping Expenses">✕ Personal Shopping Expenses</option>
                            <option value="Alcoholic Beverages">✕ Alcoholic Beverages</option>
                            <option value="Dinner Expenses">✕ Dinner Expenses</option>
                            <option value="Hotel Pick-up & Drop-off">✕ Hotel Pick-up & Drop-off</option>
                            <option value="Gratuities & Tips">✕ Gratuities & Tips</option>
                          </select>
                        </div>

                        {pkg.excludes && pkg.excludes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {pkg.excludes.map((exItem, eIdx) => (
                              <span
                                key={eIdx}
                                className="inline-flex items-center gap-1 text-[11px] bg-white text-red-800 border border-red-300 px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                              >
                                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{exItem}</span>
                                <button
                                  type="button"
                                  onClick={() => removePackageExclude(idx, eIdx)}
                                  className="text-dark-400 hover:text-red-900 font-bold ml-1 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-dark-400 italic pt-1">No exclusions added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Promos Section (Optional) */}
              <div className="pt-4 border-t border-dark-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-dark-900 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-amber-500" /> Custom Day Promos & Discounts
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Optional
                      </span>
                    </h3>
                    <p className="text-xs text-dark-500">
                      Offer special discounts on slower weekdays (e.g. 15% OFF Mon–Thu).
                    </p>
                  </div>

                  {promos.length < 3 && (
                    <button
                      type="button"
                      onClick={addPromo}
                      className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Promo
                    </button>
                  )}
                </div>

                {promos.length > 0 && (
                  <div className="space-y-3">
                    {promos.map((promo, pIdx) => (
                      <div
                        key={promo.id || pIdx}
                        className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-600" /> Promo #{pIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePromo(pIdx)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              className="w-full p-2.5 bg-white border border-dark-200 rounded-xl focus:border-amber-500 outline-none text-dark-950 text-xs font-medium"
                              placeholder="e.g. Weekday Discovery 15% OFF"
                              value={promo.title}
                              onChange={(e) => updatePromoField(pIdx, "title", e.target.value)}
                            />
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="90"
                              className="w-full pl-3 pr-8 py-2.5 bg-white border border-dark-200 rounded-xl focus:border-amber-500 outline-none text-dark-950 text-xs font-bold"
                              placeholder="15"
                              value={promo.discountPercent || ""}
                              onChange={(e) => updatePromoField(pIdx, "discountPercent", parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-400">
                              % OFF
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {ALL_DAYS.map((day) => {
                            const isSelected = promo.daysOfWeek.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => togglePromoDay(pIdx, day)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                                    : "bg-white text-dark-600 border-dark-200 hover:border-dark-350"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: PHOTOS & MEDIA ================= */}
          {currentStep === 4 && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-dark-100 pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                  <ImageIcon className="w-4 h-4" /> Step 4 of 5
                </div>
                <h2 className="text-xl font-black text-dark-900 font-display">
                  Tour Photos & Media
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  High-resolution photos showcasing the scenery, food, or experiences travelers will enjoy.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-dark-800">
                      Upload Photos * (Max 5 photos)
                    </label>
                    <span className="text-xs font-semibold text-dark-500">
                      {images.length}/5 uploaded
                    </span>
                  </div>

                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-3xl transition-all ${
                      images.length >= 5
                        ? "border-dark-200 bg-dark-50 opacity-60 cursor-not-allowed"
                        : "border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                    }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-dark-200 flex items-center justify-center mb-3 shadow-xs">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-dark-800 font-bold">
                          {images.length >= 5 ? "Maximum 5 photos reached" : "Click or drag photos here to upload"}
                        </p>
                        <p className="text-xs text-dark-400 mt-1">
                          PNG, JPG, or WEBP (auto-compressed for fast loading)
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={images.length >= 5}
                      />
                    </label>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-dark-700">
                      Uploaded Photos Preview (First photo will be your Main Cover):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dark-200 bg-dark-50 shadow-sm">
                          <img src={img} alt={`Tour Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {idx === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-dark-900/80 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                              Cover
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 shadow-md transition-opacity cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 5: REVIEW & PUBLISH ================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Review Card */}
              <div className="card p-6 sm:p-8 space-y-6">
                <div className="border-b border-dark-100 pb-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
                    <CheckCircle className="w-4 h-4" /> Step 5 of 5
                  </div>
                  <h2 className="text-xl font-black text-dark-900 font-display">
                    Review Listing & Publish
                  </h2>
                  <p className="text-xs text-dark-500 mt-0.5">
                    Review your tour details before publishing. Travelers will see this listing immediately.
                  </p>
                </div>

                {/* Live Preview Card */}
                <div className="bg-dark-50/70 border border-dark-200 rounded-3xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col md:flex-row gap-5">
                    {images[0] ? (
                      <div className="relative w-full md:w-56 h-48 rounded-2xl overflow-hidden border border-dark-200 flex-shrink-0 bg-dark-100">
                        <img src={images[0]} alt="Cover" className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-dark-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                          {formData.category}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full md:w-56 h-48 rounded-2xl bg-dark-200 flex items-center justify-center text-dark-400 flex-shrink-0">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-3 flex-grow">
                      <div>
                        <span className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                          <MapPin className="w-3.5 h-3.5" /> {formData.location}, {formData.country}
                        </span>
                        <h3 className="text-xl font-black text-dark-900 font-display">
                          {formData.title || "Untitled Tour Gig"}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-dark-600">
                        <span className="inline-flex items-center gap-1 bg-white border border-dark-200 px-2.5 py-1 rounded-lg font-semibold">
                          <Clock className="w-3.5 h-3.5 text-primary" /> {formData.durationHours} Hours
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white border border-dark-200 px-2.5 py-1 rounded-lg font-semibold">
                          <Users className="w-3.5 h-3.5 text-primary" /> Max {formData.maxGroupSize} People
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white border border-dark-200 px-2.5 py-1 rounded-lg font-semibold">
                          <Globe className="w-3.5 h-3.5 text-primary" /> {selectedLanguages.join(", ")}
                        </span>
                      </div>

                      <p className="text-xs text-dark-600 line-clamp-3 leading-relaxed">
                        {formData.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-dark-200/80 text-xs">
                    <div className="bg-white p-3.5 rounded-2xl border border-dark-200 space-y-1.5">
                      <span className="font-bold text-dark-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Hosted Days & Times:
                      </span>
                      <p className="text-dark-600"><strong>Days:</strong> {availableDays.join(", ")}</p>
                      <p className="text-dark-600"><strong>Slots:</strong> {availableTimes.join(", ")}</p>
                      {formData.meetingPoint && (
                        <p className="text-dark-600"><strong>Meeting:</strong> {formData.meetingPoint}</p>
                      )}
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-dark-200 space-y-1.5">
                      <span className="font-bold text-dark-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" /> Package Tiers ({packages.length}):
                      </span>
                      <div className="space-y-1">
                        {packages.map((pkg, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-dark-700">{pkg.name}</span>
                            <span className="font-black text-emerald-700">${parseFloat(String(pkg.priceUSD || 0)).toFixed(2)} USDC</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Algorithmic Boost Card */}
                <div className="p-5 rounded-3xl border-2 border-secondary/30 bg-secondary/5 relative overflow-hidden space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Rocket className="w-5 h-5 text-secondary" />
                        <h3 className="text-base font-black text-dark-900">
                          Algorithmic Boost (Featured Ranking)
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-dark-600 leading-relaxed">
                        Pay a one-time <strong>{CONFIG.FEATURED_GIG_PRICE} USDC</strong> Web3 network fee to boost your gig to the top of the search & explore results for 7 days.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={boostAlgorithm}
                        onChange={() => setBoostAlgorithm(!boostAlgorithm)}
                      />
                      <div className="w-11 h-6 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>

                  {boostAlgorithm && (
                    <div className="bg-white/80 p-3 rounded-xl border border-secondary/20 flex items-start gap-2 text-xs text-dark-700">
                      <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>
                        Your connected Web3 wallet will prompt a confirmation for <strong>{CONFIG.FEATURED_GIG_PRICE} USDC</strong> on Avalanche C-Chain after clicking Publish.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STICKY BOTTOM NAVIGATION BAR */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-dark-200 shadow-xl flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isCreating}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              currentStep === 1
                ? "opacity-40 cursor-not-allowed bg-dark-50 text-dark-400"
                : "bg-dark-100 hover:bg-dark-200 text-dark-800"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center hidden sm:block">
            <span className="text-xs font-bold text-dark-500">
              Step {currentStep} of 5: <span className="text-dark-900">{WIZARD_STEPS[currentStep - 1].title}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary py-3 px-6 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Continue to {WIZARD_STEPS[currentStep].title} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCreate()}
                disabled={isCreating || !hasWallet}
                className={`py-3 px-8 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                  (isCreating || !hasWallet)
                    ? "opacity-50 cursor-not-allowed bg-dark-300 text-white"
                    : boostAlgorithm
                    ? "bg-secondary hover:bg-secondary-dark text-white shadow-secondary/20 hover:scale-[1.02] active:scale-95"
                    : "btn-primary shadow-primary/20 hover:scale-[1.02] active:scale-95"
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing Gig...
                  </>
                ) : boostAlgorithm ? (
                  <>
                    <Rocket className="w-4 h-4" /> Pay {CONFIG.FEATURED_GIG_PRICE} USDC & Publish Boosted
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Publish Tour Gig
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Boost Payment Modal */}
      {pendingBoostGigId && !activatingBoost && (
        <PaymentModal
          isOpen={true}
          onClose={handleBoostSkipped}
          amount={CONFIG.FEATURED_GIG_PRICE}
          token="USDC"
          gigTitle="Gig Boost — 7 Days Featured"
          bookingDate={new Date().toISOString().slice(0, 10)}
          bookingId={`BOOST_${pendingBoostGigId.slice(-6)}`}
          onConfirm={handleBoostConfirmed}
        />
      )}

      {activatingBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-semibold text-dark-900 text-sm">Activating boost...</p>
            <p className="text-xs text-dark-400 mt-1">Verifying on-chain and updating ranking</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
