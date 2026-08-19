"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import toast from "react-hot-toast";
import { Rocket, Info, Image as ImageIcon, MapPin, DollarSign, Clock, Users, X, FileText, Globe, Loader2, AlertCircle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { CONFIG } from "@/lib/config";
import PaymentModal from "@/components/payment/PaymentModal";

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
    
    if (!formData.title || !formData.price || !formData.location || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image of your tour");
      return;
    }

    try {
      setIsCreating(true);
      toast.loading("Creating your tour gig...", { id: "create-gig" });

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
          durationHours: parseInt(formData.durationHours),
          maxGroupSize: parseInt(formData.maxGroupSize),
          guide_price: parseFloat(formData.price),
          images: images,
          benefits: benefitsList,
          availableDays,
          availableTimes,
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
            </div>
          </div>

          {/* Section 2: Details & Pricing */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-bold text-dark-900 border-b border-dark-100 pb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Pricing & Logistics
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-dark-400" /> Price per Person (USDC) *
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    className="w-full p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950 font-semibold"
                    placeholder="45.00"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
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

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Custom Benefits / Tour Perks</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-grow p-3 bg-dark-50/50 border border-dark-200 rounded-xl focus:border-primary outline-none text-dark-950"
                    placeholder="e.g. Free local snacks, Exclusive camera photography"
                    value={benefitInput}
                    onChange={e => setBenefitInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {benefitsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {benefitsList.map((benefit, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold">
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(idx)}
                          className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  You will be prompted by your connected wallet to pay <strong>{CONFIG.FEATURED_GIG_PRICE} USDC</strong> on the <strong>Base Network</strong>. This boost will immediately feature your gig.
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
