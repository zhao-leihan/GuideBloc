"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import toast from "react-hot-toast";
import { 
  Rocket, Info, Image as ImageIcon, MapPin, DollarSign, Clock, Users, X, 
  FileText, Globe, Loader2, AlertCircle, Calendar, CheckCircle, XCircle, 
  Languages as LanguagesIcon, Sparkles, Plus, Layers, Percent, Tag, Trash2, Gift, CheckCircle2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CONFIG } from "@/lib/config";
import PaymentModal from "@/components/payment/PaymentModal";

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

import { COUNTRIES as countries } from "@/lib/countries";

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const hasWallet = !!user?.walletAddress;

  const [isCreating, setIsCreating] = useState(false);
  const [boostAlgorithm, setBoostAlgorithm] = useState(false);
  // ID of the newly created gig — set after creation, used by boost PaymentModal
  const [pendingBoostGigId, setPendingBoostGigId] = useState<string | null>(null);
  const [activatingBoost, setActivatingBoost] = useState(false);
  const [images, setImages] = useState<string[]>([]);
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
  const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MORNING_TIMES = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"];
  const AFTERNOON_TIMES = ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
  const NIGHT_TIMES = ["06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"];
  const ALL_TIMES = [...MORNING_TIMES, ...AFTERNOON_TIMES, ...NIGHT_TIMES];

  const [availableDays, setAvailableDays] = useState<string[]>(ALL_DAYS);
  const [availableTimes, setAvailableTimes] = useState<string[]>(["08:00 AM", "01:00 PM", "06:00 PM"]);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [benefitsList, setBenefitsList] = useState<string[]>([]);

  // Custom Tier Packages State (Max 4 packages)
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

  // Custom Promos State (Max 3 promo rules)
  const [promos, setPromos] = useState<TourPromoItem[]>([]);

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

  // Languages & Logistics State
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English", "Indonesian"]);
  const [customLangInput, setCustomLangInput] = useState("");

  const [includedList, setIncludedList] = useState<string[]>([
    "Licensed Local Tour Guide",
    "Bottled Mineral Water",
  ]);
  const [includedInput, setIncludedInput] = useState("");

  const [excludedList, setExcludedList] = useState<string[]>([
    "Personal Shopping Expenses",
    "Dinner & Alcoholic Drinks",
  ]);
  const [excludedInput, setExcludedInput] = useState("");

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

  const addIncluded = (item?: string) => {
    const text = (item || includedInput).trim();
    if (text && !includedList.includes(text)) {
      setIncludedList([...includedList, text]);
      if (!item) setIncludedInput("");
    }
  };

  const removeIncluded = (idx: number) => {
    setIncludedList(includedList.filter((_, i) => i !== idx));
  };

  const addExcluded = (item?: string) => {
    const text = (item || excludedInput).trim();
    if (text && !excludedList.includes(text)) {
      setExcludedList([...excludedList, text]);
      if (!item) setExcludedInput("");
    }
  };

  const removeExcluded = (idx: number) => {
    setExcludedList(excludedList.filter((_, i) => i !== idx));
  };

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

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBenefitsList([...benefitsList, benefitInput.trim()]);
      setBenefitInput("");
    }
  };

  const removeBenefit = (idx: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== idx));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 5 images
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (packages.length === 0 || packages.some(pkg => !pkg.name || parseFloat(String(pkg.priceUSD || 0)) <= 0)) {
      toast.error("Please configure at least 1 package with a valid name and price (min $0.01)");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image of your tour");
      return;
    }

    try {
      setIsCreating(true);
      toast.loading("Creating your tour gig...", { id: "create-gig" });

      const baseGuidePrice = parseFloat(String(packages[0].priceUSD)) || 0.01;
      const aggregatedIncluded = Array.from(new Set(packages.flatMap(p => p.includes || [])));
      const aggregatedExcluded = Array.from(new Set(packages.flatMap(p => p.excludes || [])));

      // 1. Create Gig on backend
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
      toast.success("Gig created successfully!", { id: "create-gig" });

      // 2. If boost was requested, open the PaymentModal for the new gig
      if (boostAlgorithm) {
        setPendingBoostGigId(newGig.id);
        // Don't redirect yet — wait for boost payment flow
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

  // Called by PaymentModal after boost payment confirmed on-chain
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
        toast.success("Gig created and boosted to Featured for 7 days.");
      } else {
        const err = await res.json();
        toast.error(err.message || "Boost registration failed. Try from My Gigs.");
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
    toast.success("Gig created. You can boost it anytime from My Gigs.");
    router.push("/dashboard/guide/gigs");
  };

  return (
    <DashboardLayout role="guide">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Create New Tour Gig</h1>
          <p className="text-dark-500">Offer a new authentic experience to travelers and display it on the Explore page.</p>
        </div>

        {!hasWallet && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Payout Wallet Required</h4>
              <p className="text-xs text-amber-805 mt-1 leading-relaxed font-semibold">
                You must connect a Web3 wallet (MetaMask, Coinbase Wallet, or Solflare) in the **Wallet** tab before you can create and publish gig listings. This ensures you can receive secure escrow payouts upon tour completion.
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

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold text-dark-900 border-b border-dark-100 pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Basic Info
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Tour Title *</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-dark-950 font-medium"
                  placeholder="e.g. Ubud Hidden Waterfall & Jungle Swings"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <Globe className="w-4 h-4 text-dark-400" /> Category *
                  </label>
                  <select
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-dark-400" /> Country *
                  </label>
                  <select
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
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
                  <label className="block text-sm font-medium text-dark-700 mb-1">Specific Location / City *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    placeholder="e.g. Ubud, Bali"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" /> Designated Meeting Point
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    placeholder="e.g. In front of Hachiko Statue, Exit 8"
                    value={formData.meetingPoint}
                    onChange={e => setFormData({...formData, meetingPoint: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Schedule & Logistics */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold text-dark-900 border-b border-dark-100 pb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Schedule & Logistics
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-dark-400" /> Duration (Hours) *
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    placeholder="4"
                    value={formData.durationHours}
                    onChange={e => setFormData({...formData, durationHours: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <Users className="w-4 h-4 text-dark-400" /> Max Group Size *
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    placeholder="8"
                    value={formData.maxGroupSize}
                    onChange={e => setFormData({...formData, maxGroupSize: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* AVAILABLE DAYS SELECTOR FOR GUIDE */}
              <div className="space-y-2 pt-2 border-t border-dark-100">
                <label className="block text-sm font-bold text-dark-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Available Tour Days *
                </label>
                <p className="text-xs text-dark-500">Select which days of the week you are available to host this tour:</p>
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
                            }
                          } else {
                            setAvailableDays([...availableDays, day]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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

              {/* AVAILABLE TIME SLOTS SELECTOR FOR GUIDE (CLEAN APPLE-STYLE UX) */}
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
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Auto-space slots
                  </button>
                </div>
                <p className="text-xs text-dark-500">Select start times for tourists to choose from (click to toggle or add custom):</p>

                {/* SLEEK SINGLE PILL GRID WITH INLINE CUSTOM TIME PICKER */}
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
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-primary text-white border-primary shadow-xs flex items-center gap-1"
                    >
                      {time}
                      <X className="w-3 h-3 hover:opacity-80" />
                    </button>
                  ))}

                  {ALL_TIMES.filter(t => !availableTimes.includes(t)).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setAvailableTimes([...availableTimes, time])}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-dark-50 text-dark-600 border-dark-200 hover:border-dark-350"
                    >
                      {time}
                    </button>
                  ))}

                  {/* INLINE CUSTOM TIME PICKER */}
                  <div className="flex items-center gap-1 bg-dark-50 border border-dark-200 rounded-xl px-2 py-1">
                    <input
                      type="time"
                      value={customTimeInput}
                      onChange={(e) => setCustomTimeInput(e.target.value)}
                      className="bg-transparent text-xs font-bold text-dark-800 outline-none w-16"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTime}
                      className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* OVERLAP WARNING BADGE */}
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
                          A <strong>{durHours}-hour tour</strong> starting at <strong>{overlaps[0].t1}</strong> finishes at <strong>{overlaps[0].end1Str}</strong>. The <strong>{overlaps[0].t2}</strong> departure slot overlaps while you are still hosting the previous group!
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* SPOKEN LANGUAGES SELECTOR (ROUNDED PILLS / BULAT MODERN LOOK) */}
              <div className="space-y-2 pt-2 border-t border-dark-100">
                <label className="block text-sm font-bold text-dark-800 flex items-center gap-1.5">
                  <LanguagesIcon className="w-4 h-4 text-primary" /> Spoken Languages *
                </label>
                <p className="text-xs text-dark-500">Select which languages you can comfortably guide in (click to toggle or add custom):</p>
                <div className="flex flex-wrap gap-2 pt-1 items-center">
                  {selectedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border bg-primary text-white border-primary shadow-xs flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
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
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border bg-dark-50 text-dark-600 border-dark-200 hover:border-dark-350 hover:bg-dark-100/60 cursor-pointer"
                    >
                      + {lang}
                    </button>
                  ))}

                  {/* INLINE CUSTOM LANGUAGE INPUT */}
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
                      className="px-2 py-0.5 bg-primary text-white text-[11px] font-bold rounded-full hover:bg-primary-dark transition-all"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description *</label>
                <textarea 
                  className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 h-32 resize-none"
                  placeholder="Provide a detailed description of the tour, what travelers will experience, what is included/excluded, etc."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Custom Tour Packages & Tiered Pricing (Max 4) */}
          <div className="card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" /> Tour Packages & Tiered Pricing
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Max 4 Packages
                  </span>
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  Design 1 to 4 tailored package tiers with custom inclusions and exclusions. Tourists will choose their package directly on the tour page.
                </p>
              </div>

              {packages.length < 4 && (
                <button
                  type="button"
                  onClick={addPackage}
                  className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Package ({packages.length}/4)
                </button>
              )}
            </div>

            <div className="space-y-5">
              {packages.map((pkg, idx) => (
                <div 
                  key={pkg.id || idx} 
                  className="p-5 rounded-2xl bg-dark-50/60 border border-dark-200 space-y-4 hover:border-primary/50 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-dark-900">
                        Package #{idx + 1}
                      </span>
                    </div>

                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(idx)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Package
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    <div className="sm:col-span-7 md:col-span-8">
                      <label className="block text-xs font-bold text-dark-700 mb-1.5 h-4 leading-4 truncate">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-sm font-semibold"
                        placeholder="e.g. Basic Tour, Standard Transit, VIP All-Inclusive"
                        value={pkg.name}
                        onChange={(e) => updatePackageField(idx, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="sm:col-span-5 md:col-span-4">
                      <label className="block text-xs font-bold text-dark-700 mb-1.5 h-4 leading-4 truncate" title="Your Take-Home Payout (USDC / USD) *">
                        Take-Home Price (USDC) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="w-full pl-8 pr-3 py-2.5 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-sm font-bold"
                          placeholder="0.01"
                          value={pkg.priceUSD !== undefined ? pkg.priceUSD : ""}
                          onChange={(e) => updatePackageField(idx, "priceUSD", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="flex flex-wrap items-center justify-between text-xs bg-emerald-50/60 border border-emerald-500/20 p-2.5 rounded-xl">
                    <span className="text-dark-700 font-medium">
                      Your Net Payout (100%): <strong className="text-emerald-700 font-extrabold">${(parseFloat(String(pkg.priceUSD || 0)) || 0).toFixed(2)} USDC</strong>
                    </span>
                    <span className="text-dark-600">
                      Tourist Price (+10% platform fee): <strong className="text-primary font-extrabold">${((parseFloat(String(pkg.priceUSD || 0)) || 0) * 1.10).toFixed(2)} USDC</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark-700 mb-1">
                      Package Summary & Experience Highlights
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 text-xs"
                      placeholder="e.g. Full guided walking tour with public transit pass, bento lunch & admission"
                      value={pkg.description}
                      onChange={(e) => updatePackageField(idx, "description", e.target.value)}
                    />
                  </div>

                  {/* 2-Column Compact Inclusions & Exclusions Builder */}
                  <div className="pt-3 border-t border-dark-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: What's Included */}
                    <div className="p-3.5 bg-emerald-50/40 border border-emerald-500/20 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> What&apos;s Included
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-700">
                          {pkg.includes?.length || 0} item{pkg.includes?.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-grow p-1.5 px-2.5 bg-white border border-dark-200 rounded-lg focus:border-emerald-500 outline-none text-dark-950 text-xs"
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
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Quick Presets Selection Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-dark-500 font-medium shrink-0">Quick Add:</span>
                        <select
                          className="w-full text-[11px] p-1 bg-white border border-dark-200 rounded-md text-dark-700 outline-none focus:border-emerald-500"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addPackageInclude(idx, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="" disabled>Select a preset to insert...</option>
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

                      {/* Active Inclusions Tag List */}
                      {pkg.includes && pkg.includes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {pkg.includes.map((perk, pIdx) => (
                            <span
                              key={pIdx}
                              className="inline-flex items-center gap-1 text-[11px] bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-medium shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[150px]">{perk}</span>
                              <button
                                type="button"
                                onClick={() => removePackageInclude(idx, pIdx)}
                                className="text-dark-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
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

                    {/* Right Column: What's NOT Included */}
                    <div className="p-3.5 bg-red-50/40 border border-red-500/20 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-500" /> What&apos;s NOT Included
                        </label>
                        <span className="text-[10px] font-semibold text-red-700">
                          {pkg.excludes?.length || 0} item{pkg.excludes?.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-grow p-1.5 px-2.5 bg-white border border-dark-200 rounded-lg focus:border-red-500 outline-none text-dark-950 text-xs"
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
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Quick Presets Selection Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-dark-500 font-medium shrink-0">Quick Add:</span>
                        <select
                          className="w-full text-[11px] p-1 bg-white border border-dark-200 rounded-md text-dark-700 outline-none focus:border-red-500"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addPackageExclude(idx, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="" disabled>Select a preset to insert...</option>
                          <option value="Personal Shopping Expenses">✕ Personal Shopping Expenses</option>
                          <option value="Alcoholic Beverages">✕ Alcoholic Beverages</option>
                          <option value="Dinner Expenses">✕ Dinner Expenses</option>
                          <option value="Hotel Pick-up & Drop-off">✕ Hotel Pick-up & Drop-off</option>
                          <option value="Gratuities & Tips">✕ Gratuities & Tips</option>
                        </select>
                      </div>

                      {/* Active Exclusions Tag List */}
                      {pkg.excludes && pkg.excludes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {pkg.excludes.map((exItem, eIdx) => (
                            <span
                              key={eIdx}
                              className="inline-flex items-center gap-1 text-[11px] bg-white text-red-800 border border-red-300 px-2 py-0.5 rounded-md font-medium shadow-2xs"
                            >
                              <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="truncate max-w-[150px]">{exItem}</span>
                              <button
                                type="button"
                                onClick={() => removePackageExclude(idx, eIdx)}
                                className="text-dark-400 hover:text-red-900 font-bold ml-0.5 cursor-pointer"
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
          </div>

          {/* Section: Custom Promos & Special Day Discounts */}
          <div className="card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-500" /> Custom Promotions & Day Discounts
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Optional
                  </span>
                </h2>
                <p className="text-xs text-dark-500 mt-0.5">
                  Design special discounts for specific days of the week (e.g. 15% OFF for Weekdays or Weekend Specials).
                </p>
              </div>

              {promos.length < 3 && (
                <button
                  type="button"
                  onClick={addPromo}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Promo Rule
                </button>
              )}
            </div>

            {promos.length === 0 ? (
              <div className="p-4 rounded-xl bg-dark-50 border border-dashed border-dark-200 text-center text-xs text-dark-500">
                No active promotional rules configured. Click &quot;Add Promo Rule&quot; to design a custom discount!
              </div>
            ) : (
              <div className="space-y-4">
                {promos.map((promo, pIdx) => (
                  <div
                    key={promo.id || pIdx}
                    className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" /> Promo Rule #{pIdx + 1}
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
                        <label className="block text-xs font-bold text-dark-700 mb-1">
                          Promo Title / Banner Label *
                        </label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-white border border-dark-200 rounded-xl focus:border-amber-500 outline-none text-dark-950 text-sm font-medium"
                          placeholder="e.g. Weekday Discovery 15% OFF, Autumn Early Bird"
                          value={promo.title}
                          onChange={(e) => updatePromoField(pIdx, "title", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-dark-700 mb-1">
                          Discount Percentage (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            className="w-full pl-3 pr-8 py-2.5 bg-white border border-dark-200 rounded-xl focus:border-amber-500 outline-none text-dark-950 text-sm font-bold"
                            placeholder="e.g. 15"
                            value={promo.discountPercent || ""}
                            onChange={(e) => updatePromoField(pIdx, "discountPercent", parseInt(e.target.value) || 0)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-400">
                            % OFF
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Valid Days */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-dark-700">
                        Applicable Tour Days for this Promo
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DAYS.map((day) => {
                          const isSelected = promo.daysOfWeek.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => togglePromoDay(pIdx, day)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Gallery Upload */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold text-dark-900 border-b border-dark-100 pb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" /> Tour Photos
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Upload Images * (Max 5, up to 5MB each)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dark-200 border-dashed rounded-2xl cursor-pointer bg-dark-50 hover:bg-dark-100/50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-dark-400 mb-2" />
                      <p className="text-sm text-dark-500 font-semibold">Click to upload photos</p>
                      <p className="text-xs text-dark-400">PNG, JPG or JPEG</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-dark-200 bg-dark-50">
                      <img src={img} alt={`Tour Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-500 text-white opacity-90 hover:opacity-100 shadow-md transition-opacity"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Algorithmic Boost */}
          <div className="card p-6 border-2 border-secondary/30 bg-secondary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Rocket className="w-24 h-24 text-secondary" />
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-secondary" /> Algorithmic Boost
                </h2>
                <p className="text-sm text-dark-600 max-w-md mt-1">
                  Pay a one-time <strong>{CONFIG.FEATURED_GIG_PRICE} USDC</strong> Web3 network fee to boost your gig to the top of the search results for 7 days.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
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
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-secondary/20 flex items-start gap-2 animate-in fade-in zoom-in duration-300 relative z-10">
                <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-dark-600">
                  You will be prompted by your connected wallet to pay <strong>{CONFIG.FEATURED_GIG_PRICE} USDC</strong> on <strong>Avalanche C-Chain</strong>. This boost will immediately feature your gig.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/guide/gigs")}
              className="btn-ghost px-6 cursor-pointer"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isCreating || !hasWallet}
              className={`btn-primary px-8 flex items-center gap-2 cursor-pointer ${(isCreating || !hasWallet) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : boostAlgorithm ? (
                `Pay ${CONFIG.FEATURED_GIG_PRICE} USDC & Create Boosted Gig`
              ) : (
                "Create Gig"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Boost Payment Modal — appears after gig is created if boost was selected */}
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
