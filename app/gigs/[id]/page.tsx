"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Clock, Users, Star, Globe, ChevronLeft, ChevronRight,
  Calendar, Shield, CheckCircle, XCircle, MessageSquare, X,
  CheckCircle2, Receipt, ArrowRight, CreditCard, ShieldCheck, User as UserIcon, Plus, Loader2, AlertCircle, ArrowRightLeft, QrCode, Landmark, Copy
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatCurrency, formatDate, getCountryFlag, getCategoryIcon, cn } from "@/lib/utils";
import ReviewCard from "@/components/reviews/ReviewCard";
import { initiatePayment } from "@/lib/crypto/payment";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  
  // Booking sidebar details
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [groupSize, setGroupSize] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [txHash, setTxHash] = useState("");
  
  // Modals visibility
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<"tokocrypto" | "okx" | "binance" | "mexc">("tokocrypto");
  const [exchangeTxId, setExchangeTxId] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAlchemyPayModal, setShowAlchemyPayModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");

  // Alchemy Pay destination wallet
  const [alchemypayWallet, setAlchemypayWallet] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [showAlchemypayIframe, setShowAlchemypayIframe] = useState(false);

  // Passenger / Group Details
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState<any[]>([]);
  const [savedCompanions, setSavedCompanions] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      const addr = (session.user as any).walletAddress;
      if (addr) {
        setAlchemypayWallet(addr);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchGig();
  }, [params.id]);

  useEffect(() => {
    const midtransScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-dummy";

    const script = document.createElement("script");
    script.src = midtransScriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${params.id}`);
      const data = await res.json();
      setGig(data);
    } catch {
      setGig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPassengerModal = async () => {
    if (!session) {
      toast.error("Please sign in to book a tour");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!bookingDate) {
      toast.error("Please select a date first");
      return;
    }

    toast.loading("Loading passenger details...");
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const profile = await res.json();
        setSavedCompanions(profile.savedMembers || []);

        const list: any[] = [];
        // Participant 1: The Main Tourist
        list.push({
          isMainUser: true,
          title: profile.title || "Mr",
          name: profile.name || "",
          passportNumber: profile.passportNumber || "",
          idCardNumber: profile.idCardNumber || "",
          birthDate: profile.birthDate ? profile.birthDate.split("T")[0] : "",
          age: profile.age ? profile.age.toString() : "",
        });

        // Additional Participants
        for (let i = 1; i < groupSize; i++) {
          list.push({
            isMainUser: false,
            title: "Mr",
            name: "",
            passportNumber: "",
            idCardNumber: "",
            birthDate: "",
            age: "",
            selectedCompanionId: "",
          });
        }

        setPassengerDetails(list);
        setShowPassengerModal(true);
      } else {
        toast.error("Failed to load tourist profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading passenger details");
    } finally {
      toast.dismiss();
    }
  };

  const handleSelectCompanion = (index: number, companionId: string) => {
    const updated = [...passengerDetails];
    if (companionId === "") {
      updated[index] = {
        ...updated[index],
        selectedCompanionId: "",
        title: "Mr",
        name: "",
        passportNumber: "",
        idCardNumber: "",
        birthDate: "",
        age: "",
      };
    } else {
      const companion = savedCompanions.find((c) => c.id === companionId);
      if (companion) {
        updated[index] = {
          ...updated[index],
          selectedCompanionId: companionId,
          title: companion.title || "Mr",
          name: companion.name || "",
          passportNumber: companion.passportNumber || "",
          idCardNumber: companion.idCardNumber || "",
          birthDate: companion.birthDate ? companion.birthDate.split("T")[0] : "",
          age: companion.age ? companion.age.toString() : "",
        };
      }
    }
    setPassengerDetails(updated);
  };

  const handlePassengerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations: Name must be entered. At least one of Passport or ID Card must be filled. Age & BirthDate must be entered.
    for (let i = 0; i < passengerDetails.length; i++) {
      const p = passengerDetails[i];
      const pName = i === 0 ? "You (Main Traveler)" : `Passenger ${i + 1}`;
      
      if (!p.name.trim()) {
        toast.error(`Name is required for ${pName}`);
        return;
      }
      if (!p.passportNumber.trim() && !p.idCardNumber.trim()) {
        toast.error(`Please provide either a Passport Number or ID Card Number for ${pName}`);
        return;
      }
      if (!p.birthDate) {
        toast.error(`Birth Date is required for ${pName}`);
        return;
      }
      if (!p.age) {
        toast.error(`Age is required for ${pName}`);
        return;
      }
    }

    // Save main user's profile details if they edited them during checkout
    const mainUser = passengerDetails[0];
    if (mainUser) {
      try {
        await fetch("/api/users/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: mainUser.name,
            title: mainUser.title,
            passportNumber: mainUser.passportNumber,
            idCardNumber: mainUser.idCardNumber,
            birthDate: mainUser.birthDate,
            age: mainUser.age ? parseInt(mainUser.age) : null,
          }),
        });
      } catch (err) {
        console.error("Failed to sync main tourist profile:", err);
      }
    }

    setShowPassengerModal(false);
    setShowWalletModal(true);
  };

  const handleBookNow = async (walletType: "metamask" | "coinbase" | "walletconnect") => {
    let bookingId: string | null = null;
    try {
      setShowWalletModal(false);
      setIsBooking(true);

      // 1. Create a pending booking in the database first
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: gig.id,
          bookingDate,
          bookingTime,
          groupSize,
          participants: passengerDetails,
          cryptoToken: "USDC",
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.message || "Failed to create booking in database");
      }

      const dbBooking = await createRes.json();
      bookingId = dbBooking.id;

      toast.info(`Requesting Approval via ${walletType.toUpperCase()}...`);
      
      const mappedWalletType = walletType === "walletconnect" ? undefined : (walletType as any);

      const hash = await initiatePayment({
        bookingId: dbBooking.id,
        amountUSD: gig.priceUSD * groupSize,
        token: "USDC", 
        network: "base", 
        guideWalletAddress: gig.guide?.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
        walletType: mappedWalletType
      });

      // 2. Update booking status to CONFIRMED (funded)
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          txHash: hash,
          paymentNetwork: "base",
        }),
      });

      setTxHash(hash);
      setShowSuccessModal(true);
      toast.success("Payment Successful! Escrow locked.");
      
    } catch (error: any) {
      console.error(error);
      if (bookingId) {
        try {
          await fetch(`/api/bookings/${bookingId}`, {
            method: "DELETE",
          });
        } catch (delErr) {
          console.error("Failed to delete cancelled booking:", delErr);
        }
      }
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsBooking(false);
    }
  };

  const handlePayMidtrans = async () => {
    if (!gig) return;
    setIsBooking(true);
    let bookingId: string | null = null;

    try {
      // 1. Create a pending booking in the database
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: gig.id,
          bookingDate,
          bookingTime,
          groupSize,
          participants: passengerDetails,
          cryptoToken: "USDC",
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.message || "Failed to create booking in database");
      }

      const dbBooking = await createRes.json();
      bookingId = dbBooking.id;

      // 2. Fetch the Midtrans token for this booking
      toast.info("Connecting to Midtrans Local Checkout...");
      const tokenRes = await fetch("/api/payment/midtrans-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get Midtrans payment token");
      }

      const { token, redirectUrl } = await tokenRes.json();
      setShowWalletModal(false);

      // 3. Open Midtrans Snap popup
      if ((window as any).snap) {
        (window as any).snap.pay(token, {
          onSuccess: function (result: any) {
            console.log("Midtrans payment success:", result);
            toast.success("Payment successful! Escrow locked.");
            setTxHash(result.transaction_id || "N/A");
            setShowSuccessModal(true);
          },
          onPending: function (result: any) {
            console.log("Midtrans payment pending:", result);
            toast.info("Payment pending. Check details in your Bookings.");
            router.push("/dashboard/tourist/bookings");
          },
          onError: function (result: any) {
            console.error("Midtrans payment error:", result);
            toast.error("Payment failed. Booking cancelled.");
            if (bookingId) {
              fetch(`/api/bookings/${bookingId}`, { method: "DELETE" }).catch(console.error);
            }
          },
          onClose: function () {
            console.log("Midtrans snap popup closed");
            toast.warning("Payment cancelled.");
            if (bookingId) {
              fetch(`/api/bookings/${bookingId}`, { method: "DELETE" }).catch(console.error);
            }
          }
        });
      } else {
        // Fallback to redirection
        window.location.href = redirectUrl;
      }
    } catch (error: any) {
      console.error(error);
      if (bookingId) {
        try {
          await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" }).catch(console.error);
        } catch (delErr) {
          console.error("Failed to clean up booking:", delErr);
        }
      }
      toast.error(error.message || "Payment checkout failed");
    } finally {
      setIsBooking(false);
    }
  };

  const handleAlchemyPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 15) {
      toast.error("Please enter a valid credit card number");
      return;
    }
    
    setShowAlchemyPayModal(false);
    setIsBooking(true);
    
    try {
      // 1. Create pending booking in database
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: gig.id,
          bookingDate,
          bookingTime,
          groupSize,
          participants: passengerDetails,
          cryptoToken: "USDC",
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create booking in database");
      }

      const dbBooking = await createRes.json();
      const bookingId = dbBooking.id;

      toast.info("Processing Fiat-to-Crypto via Alchemy Pay...");
      await new Promise(r => setTimeout(r, 2500));
      toast.success("USDC Successfully Purchased!");
      
      toast.info("Executing Smart Contract Escrow...");
      await new Promise(r => setTimeout(r, 2000));
      
      const mockTxHash = "0xMOCK_ALCHEMY_" + Array.from({length: 48}, () => Math.floor(Math.random() * 16).toString(16)).join("");

      // 2. Update booking status to CONFIRMED (funded)
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          txHash: mockTxHash,
          paymentNetwork: "base",
        }),
      });

      setTxHash(mockTxHash);
      setShowSuccessModal(true);
      toast.success("Payment Successful! Escrow locked.");
    } catch (error: any) {
      toast.error(error.message || "Alchemy Pay transaction failed");
    } finally {
      setIsBooking(false);
    }
  };

  const handleExchangeConfirm = async () => {
    if (!gig) return;
    if (!exchangeTxId.trim()) {
      toast.error("Please enter your withdrawal TxID / Hash from your exchange.");
      return;
    }

    setIsBooking(true);
    toast.info("Verifying Exchange TxID on Base Network...");
    await new Promise((r) => setTimeout(r, 1200));

    try {
      // 1. Create pending booking in database
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: gig.id,
          bookingDate,
          bookingTime,
          groupSize,
          participants: passengerDetails,
          cryptoToken: "USDC",
        }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create booking record");
      }

      const dbBooking = await createRes.json();
      const bookingId = dbBooking.id;

      // 2. Update booking status to CONFIRMED (funded)
      const patchRes = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          txHash: exchangeTxId.trim(),
          paymentNetwork: "base",
        }),
      });

      if (!patchRes.ok) {
        const errorData = await patchRes.json();
        throw new Error(errorData.message || "Exchange TxID verification failed");
      }

      setTxHash(exchangeTxId.trim());
      setShowExchangeModal(false);
      setShowSuccessModal(true);
      toast.success("Exchange Payout Verified & Escrow Locked!");
    } catch (error: any) {
      toast.error(error.message || "Exchange verification failed");
    } finally {
      setIsBooking(false);
    }
  };

  const handleAskGuide = async () => {
    if (!session) {
      toast.error("Please sign in to chat with the guide");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const user = session.user as any;
      if (user.id === gig.guide.id) {
        toast.error("You cannot chat with yourself");
        return;
      }

      toast.info("Opening chat with guide...");
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touristId: user.id,
          guideId: gig.guide.id,
          gigId: gig.id,
        }),
      });

      if (res.ok) {
        router.push(`/dashboard/tourist/messages`);
      } else {
        toast.error("Failed to start chat session");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const totalPrice = gig.priceUSD * groupSize;

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-dark-500 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-primary">Explore</Link>
          <span>/</span>
          <span className="text-dark-900">{gig.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden h-[400px] group shadow-md border border-dark-150">
                <img
                  src={gig.images[currentImage] || "/assets/placeholder.jpg"}
                  alt={gig.title}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                {gig.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((prev) => (prev === 0 ? gig.images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-dark-800 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImage((prev) => (prev === gig.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-dark-800 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              
              {gig.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth">
                  {gig.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={cn(
                        "w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer relative",
                        currentImage === i ? "border-primary scale-95 shadow-md" : "border-transparent opacity-60 hover:opacity-90"
                      )}
                    >
                      <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-primary">{getCategoryIcon(gig.category)} {gig.category}</span>
                <span className="badge badge-secondary">≈ {totalPrice.toFixed(0)} USDT</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">{gig.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-dark-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{gig.location} {getCountryFlag(gig.country)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{gig.durationHours} hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Max {gig.maxGroupSize} people</span>
                </div>
                {gig.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium text-dark-900">{gig.avgRating.toFixed(1)}</span>
                    <span>({gig.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Guide Info */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl text-primary font-bold">
                  {gig.guide.avatar ? (
                    <img src={gig.guide.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    gig.guide.name[0]
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/guides/${gig.guide.id}`} className="font-display font-semibold text-dark-900 hover:text-primary transition-colors">
                    {gig.guide.name}
                  </Link>
                  <p className="text-sm text-dark-500">Local Guide · {gig.guide.country} {getCountryFlag(gig.guide.country)}</p>
                </div>
                <Link
                  href={`/guides/${gig.guide.id}`}
                  className="btn-ghost text-sm"
                >
                  View Profile
                </Link>
              </div>
              {gig.guide.bio && (
                <p className="mt-4 text-dark-600 text-sm leading-relaxed">{gig.guide.bio}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-dark-900 mb-4">About This Tour</h2>
              <p className="text-dark-600 leading-relaxed whitespace-pre-line">{gig.description}</p>
            </div>

            {/* Languages */}
            {gig.languages?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-dark-900 mb-4">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {gig.languages.map((lang: string) => (
                    <span key={lang} className="badge badge-primary">{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Included/Excluded */}
            <div className="grid sm:grid-cols-2 gap-6">
              {gig.included?.length > 0 && (
                <div>
                  <h3 className="font-bold text-dark-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" /> What&apos;s Included
                  </h3>
                  <ul className="space-y-2">
                    {gig.included.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-dark-600">
                        <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gig.excluded?.length > 0 && (
                <div>
                  <h3 className="font-bold text-dark-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-danger" /> Not Included
                  </h3>
                  <ul className="space-y-2">
                    {gig.excluded.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-dark-600">
                        <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Custom Benefits */}
            {gig.benefits?.length > 0 && (
              <div className="border-t border-dark-100 pt-6">
                <h3 className="font-bold text-dark-900 mb-3 flex items-center gap-2">
                  <span className="text-secondary font-bold">✨</span> Tour Perks & Benefits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gig.benefits.map((benefit: string) => (
                    <span key={benefit} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-3.5 py-1.5 rounded-full text-xs font-bold border border-secondary/20 shadow-sm">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Point */}
            {gig.meetingPoint && (
              <div>
                <h2 className="text-xl font-bold text-dark-900 mb-3">Meeting Point</h2>
                <div className="card p-4 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-dark-700">{gig.meetingPoint}</span>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold text-dark-900 mb-6">
                Reviews {gig.reviewCount > 0 && `(${gig.reviewCount})`}
              </h2>
              {gig.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {gig.reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-dark-500">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-dark-900">{formatCurrency(gig.priceUSD)}</span>
                <span className="text-sm text-dark-400">/ person</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="badge badge-secondary">≈ {gig.priceUSD.toFixed(0)} USDT</span>
                <span className="text-dark-400">per person</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="input"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="input"
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Group Size</label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                    className="input"
                  >
                    {Array.from({ length: gig.maxGroupSize }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? "person" : "people"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-dark-100 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-500">{formatCurrency(gig.priceUSD)} × {groupSize}</span>
                  <span className="text-dark-900">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-dark-500">Crypto equivalent</span>
                  <span className="text-secondary font-medium">{totalPrice.toFixed(0)} USDT</span>
                </div>
                <div className="flex justify-between font-bold text-dark-900 pt-3 border-t border-dark-100">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

               <div className="space-y-3">
                {!gig?.guide?.walletAddress && (
                  <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-750 font-bold leading-relaxed">
                      Booking is temporarily disabled because this guide has not connected their payout wallet to receive payments.
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={handleOpenPassengerModal}
                  disabled={isBooking || loading || !gig?.guide?.walletAddress}
                  className={`btn-primary w-full py-4 text-lg font-bold shadow-lg ${(isBooking || loading || !gig?.guide?.walletAddress) ? 'opacity-50 cursor-not-allowed shadow-none' : 'shadow-primary/20 cursor-pointer'}`}
                >
                  {isBooking ? "Processing Payment..." : "Book & Pay"}
                </button>
                {txHash && (
                  <div className="text-xs text-secondary break-all bg-secondary/10 p-2 rounded">
                    Tx Hash: {txHash}
                  </div>
                )}
              </div>

              <button
                onClick={handleAskGuide}
                className="btn-outline w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Guide
              </button>

              <div className="flex items-center gap-2 text-xs text-dark-400 pt-2">
                <Shield className="w-4 h-4" />
                <span>Secure crypto escrow · Free cancellation 48h before</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Details Completion Modal */}
      {showPassengerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowPassengerModal(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-dark-900 p-1 bg-dark-50 hover:bg-dark-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-dark-100">
              <h2 className="text-xl font-bold text-dark-900">Passenger Information</h2>
              <p className="text-xs text-dark-500 mt-1">Please provide required details for all participants. At least one document number (Passport or ID Card) is required per traveler.</p>
            </div>

            <form onSubmit={handlePassengerFormSubmit} className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
              {passengerDetails.map((passenger, index) => (
                <div key={index} className="bg-dark-50 border border-dark-100 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-2 border-b border-dark-200">
                    <h3 className="font-bold text-sm text-dark-800 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-primary" />
                      {index === 0 ? "Traveler 1 (You / Main Account)" : `Traveler ${index + 1}`}
                    </h3>

                    {index > 0 && savedCompanions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-dark-500 uppercase">Load Saved:</span>
                        <select
                          value={passenger.selectedCompanionId || ""}
                          onChange={(e) => handleSelectCompanion(index, e.target.value)}
                          className="text-[11px] font-semibold bg-white border border-dark-200 rounded px-2 py-1 max-w-[160px] focus:border-primary outline-none"
                        >
                          <option value="">-- Add New Member --</option>
                          {savedCompanions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title ? `${c.title}. ` : ""}{c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Salutation</label>
                      <select
                        value={passenger.title}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].title = e.target.value;
                          setPassengerDetails(updated);
                        }}
                        className="input text-xs py-2 px-2"
                        required
                      >
                        <option value="Mr">Mr.</option>
                        <option value="Mrs">Mrs.</option>
                        <option value="Ms">Ms.</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].name = e.target.value;
                          setPassengerDetails(updated);
                        }}
                        placeholder="Name (as in Passport/ID)"
                        className="input text-xs py-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={passenger.passportNumber}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].passportNumber = e.target.value.toUpperCase();
                          setPassengerDetails(updated);
                        }}
                        placeholder="Passport Number (E.g. A1234567)"
                        className="input text-xs py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">ID Card Number (NIK)</label>
                      <input
                        type="text"
                        value={passenger.idCardNumber}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].idCardNumber = e.target.value.replace(/\D/g, "");
                          setPassengerDetails(updated);
                        }}
                        placeholder="ID NIK (16 Digits)"
                        className="input text-xs py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={passenger.birthDate}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].birthDate = e.target.value;
                          setPassengerDetails(updated);
                        }}
                        className="input text-xs py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dark-600 uppercase tracking-wider mb-1">Age</label>
                      <input
                        type="number"
                        value={passenger.age}
                        onChange={(e) => {
                          const updated = [...passengerDetails];
                          updated[index].age = e.target.value;
                          setPassengerDetails(updated);
                        }}
                        placeholder="Age"
                        className="input text-xs py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
                >
                  Confirm Details & Proceed to Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-secondary" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-dark-900 mb-2">Payment Successful!</h2>
            <p className="text-center text-dark-500 mb-6">Your funds are securely locked in the smart contract escrow.</p>
            
            <div className="bg-dark-50 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-center gap-2 text-dark-900 font-semibold mb-2">
                <Receipt className="w-5 h-5" /> Receipt
              </div>
              <div className="flex justify-between text-sm text-dark-600">
                <span>Tour</span>
                <span className="font-medium text-right max-w-[150px] truncate">{gig.title}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-600">
                <span>Date & Time</span>
                <span className="font-medium">{bookingDate} @ {bookingTime}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-600">
                <span>Group Size</span>
                <span className="font-medium">{groupSize} {groupSize === 1 ? "person" : "people"}</span>
              </div>
              <div className="border-t border-dark-200 my-2 pt-2 flex justify-between text-sm font-bold text-dark-900">
                <span>Total Paid</span>
                <span className="text-secondary">{totalPrice.toFixed(0)} USDC</span>
              </div>
              <div className="text-[10px] text-dark-400 font-mono break-all mt-2 pt-2 border-t border-dark-100">
                Tx: {txHash}
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/dashboard/tourist/bookings')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Go to My Bookings <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-dark-100 flex justify-between items-center bg-dark-50/50">
              <h2 className="text-xl font-bold text-dark-900">Select Payment Method</h2>
              <button onClick={() => setShowWalletModal(false)} className="text-dark-400 hover:text-dark-900 text-2xl leading-none cursor-pointer">&times;</button>
            </div>
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Option 1: Web3 Wallet */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-dark-450 uppercase tracking-wider block">Web3 Wallet (Direct Connect)</span>
                
                <div className="space-y-2">
                  <button onClick={() => handleBookNow("metamask")} className="w-full p-3.5 border border-dark-200 hover:border-primary hover:bg-primary/5 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                      <span className="font-semibold text-dark-900 text-sm group-hover:text-primary transition-colors">MetaMask</span>
                    </div>
                    <span className="text-[10px] font-medium bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full">Detected</span>
                  </button>
                  
                  <button onClick={() => handleBookNow("coinbase")} className="w-full p-3.5 border border-dark-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
                      </div>
                      <span className="font-semibold text-dark-900 text-sm group-hover:text-blue-600 transition-colors">Coinbase Wallet</span>
                    </div>
                  </button>

                  <button onClick={() => handleBookNow("walletconnect")} className="w-full p-3.5 border border-dark-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">WC</div>
                      <div>
                        <span className="font-semibold text-dark-900 text-sm group-hover:text-blue-500 transition-colors block">WalletConnect</span>
                        <span className="text-[10px] text-dark-400">Trust Wallet, Phantom, etc.</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Option 2: Exchange & Mobile QR Deposit */}
              <div className="space-y-3 pt-4 border-t border-dark-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-dark-450 uppercase tracking-wider block">Exchange & Mobile QR Deposit</span>
                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Zero Gas Stress</span>
                </div>
                
                <button 
                  onClick={() => {
                    setShowWalletModal(false);
                    setShowExchangeModal(true);
                  }}
                  className="w-full p-4 border border-dark-200 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col gap-3 transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-dark-900 text-sm group-hover:text-primary transition-colors block">Exchange App / Scan QR</span>
                        <span className="text-[11px] text-dark-500 block mt-0.5">Pay via Tokocrypto, OKX, Binance, or MEXC</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      Pay <ArrowRightLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Exchange Logo Badges Grid */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dark-100/60">
                    <span className="text-[9px] font-bold text-dark-400 uppercase tracking-wider mr-1">Supported:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E31E24] text-white flex items-center gap-1 shadow-sm">
                      Tokocrypto (0.2 USDC Fee)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F0B90B] text-black flex items-center gap-1 shadow-sm">
                      Binance
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-dark-900 text-white flex items-center gap-1 shadow-sm">
                      OKX
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                      MEXC
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exchange & Mobile QR Deposit Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-r from-dark-900 to-dark-950 p-6 text-white text-center relative">
              <button 
                onClick={() => setShowExchangeModal(false)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-primary-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                <QrCode className="w-3.5 h-3.5 text-primary-400" /> Instant Exchange Deposit
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Scan QR or Copy Address</h2>
              <p className="text-white/70 text-xs">Pay directly from Tokocrypto, OKX, Binance, or MEXC</p>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Dynamic QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-dark-50 rounded-2xl border border-dark-100 text-center">
                <div className="bg-white p-3 rounded-2xl shadow-md mb-2 border border-dark-100">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=ethereum:0x37da6bb53a3973dee2ed7b766f5e341ff123e8c8@8453?value=${(gig.priceUSD * groupSize).toFixed(2)}`} 
                    alt="Escrow QR Code" 
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
                <span className="text-[11px] text-dark-500 font-medium">Scan with your Exchange or Mobile Wallet app</span>
              </div>

              {/* Exchange Logos Selector Tabs */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-dark-450 uppercase tracking-wider block text-center">Select Your Exchange App for Custom Guide:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "tokocrypto", name: "Tokocrypto", logo: "https://upload.wikimedia.org/wikipedia/commons/6/61/Tokocrypto_Square.png", bg: "bg-[#E31E24]/10 border-[#E31E24]/30 text-[#E31E24]" },
                    { id: "binance", name: "Binance", logo: "https://public.bnbstatic.com/20190405/eb2349c3-b2f8-4a93-a286-8f86a62ea9d8.png", bg: "bg-[#F0B90B]/10 border-[#F0B90B]/40 text-dark-900" },
                    { id: "okx", name: "OKX", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/OKX_Logo.svg", bg: "bg-dark-900/10 border-dark-900/30 text-dark-900" },
                    { id: "mexc", name: "MEXC", logo: "https://media.thegrid.id/id1745580537-A8SmNL1HS2qGih6c9GEErg/7/id1745580537-F5cjUDwsR9u049YD2MXtEQ/id1761223287-yofTwDGNQzWuWUaALp4d4Q/image-1762950745.jpg", bg: "bg-blue-600/10 border-blue-600/30 text-blue-600" },
                  ].map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setSelectedExchange(ex.id as any)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-xs font-bold ${
                        selectedExchange === ex.id
                          ? `${ex.bg} ring-2 ring-primary/40 shadow-sm`
                          : "bg-dark-50 border-dark-200 text-dark-600 hover:bg-white"
                      }`}
                    >
                      <img src={ex.logo} alt={ex.name} className="w-5 h-5 object-contain rounded-full flex-shrink-0" />
                      <span className="truncate">{ex.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Custom Tutorial (English) */}
              <div className="p-4 bg-dark-50/70 border border-dark-200/80 rounded-2xl space-y-2.5 text-xs text-dark-800">
                <div className="font-bold flex items-center justify-between border-b border-dark-200/60 pb-2">
                  <span className="flex items-center gap-1.5 text-dark-900 font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    How to Pay via {selectedExchange === "tokocrypto" ? "Tokocrypto" : selectedExchange === "okx" ? "OKX" : selectedExchange === "binance" ? "Binance" : "MEXC"}
                  </span>
                  <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">Base Network</span>
                </div>

                <ol className="space-y-1.5 list-decimal list-inside text-[11px] leading-relaxed text-dark-700 font-medium">
                  {selectedExchange === "tokocrypto" && (
                    <>
                      <li>Open <strong>Tokocrypto</strong> app &rarr; Go to <strong>Wallet</strong> &rarr; Select <strong>Withdraw</strong>.</li>
                      <li>Search token <strong>USDC</strong> &rarr; Select <strong>Crypto Transfer</strong> method.</li>
                      <li>Scan the QR Code above or paste the <strong>Escrow Deposit Address</strong>.</li>
                      <li>Select Network: <strong>BASE</strong> (Network Fee: <strong>0.2 USDC</strong>).</li>
                      <li>Enter Withdrawal Amount: <strong>${(gig.priceUSD * groupSize + 0.2).toFixed(2)} USDC</strong> (includes 0.2 fee so escrow receives ${(gig.priceUSD * groupSize).toFixed(2)} USDC) &amp; complete PIN/OTP verification.</li>
                      <li>Copy the <strong>TxID</strong> from Tokocrypto Withdrawal History &amp; paste below.</li>
                    </>
                  )}
                  {selectedExchange === "okx" && (
                    <>
                      <li>Open <strong>OKX</strong> app &rarr; Go to <strong>Assets</strong> tab &rarr; Tap <strong>Withdraw</strong>.</li>
                      <li>Select <strong>USDC</strong> &rarr; Choose <strong>On-chain transfer</strong>.</li>
                      <li>Scan the QR Code or paste the <strong>Escrow Deposit Address</strong>.</li>
                      <li>Select Network: <strong>Base (Base Mainnet)</strong>.</li>
                      <li>Enter withdrawal amount <strong>${(gig.priceUSD * groupSize).toFixed(2)} USDC</strong> &amp; tap <strong>Submit</strong>.</li>
                      <li>Open Withdrawal Details, copy the <strong>TxID</strong>, and paste below.</li>
                    </>
                  )}
                  {selectedExchange === "binance" && (
                    <>
                      <li>Open <strong>Binance</strong> app &rarr; Tap <strong>Wallet</strong> &rarr; Select <strong>Withdraw</strong>.</li>
                      <li>Select Token <strong>USDC</strong> &rarr; <strong>Send via Crypto Network</strong>.</li>
                      <li>Scan the QR Code above or paste the <strong>Escrow Deposit Address</strong>.</li>
                      <li><strong>Important</strong>: Under Network, select <strong>BASE</strong>.</li>
                      <li>Enter withdrawal amount <strong>${(gig.priceUSD * groupSize).toFixed(2)} USDC</strong> &amp; tap <strong>Withdraw</strong>.</li>
                      <li>Copy the <strong>TxID / Hash</strong> from Binance Withdrawal History &amp; paste below.</li>
                    </>
                  )}
                  {selectedExchange === "mexc" && (
                    <>
                      <li>Open <strong>MEXC</strong> app &rarr; Go to <strong>Wallets</strong> &rarr; Tap <strong>Withdraw</strong>.</li>
                      <li>Search and select token <strong>USDC</strong>.</li>
                      <li>Scan the QR Code or copy the <strong>Escrow Address</strong> above.</li>
                      <li>Select Network: <strong>Base</strong>.</li>
                      <li>Enter withdrawal amount <strong>${(gig.priceUSD * groupSize).toFixed(2)} USDC</strong> &amp; tap <strong>Confirm Withdrawal</strong>.</li>
                      <li>Copy the <strong>TxHash</strong> from transaction history &amp; paste below.</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Copy Address & Amount Fields */}
              <div className="space-y-3">
                {/* Total USDC Amount Field (Includes Fee) */}
                <div className="p-3.5 bg-dark-50 rounded-2xl border border-dark-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-dark-450 uppercase tracking-wider block">
                      {selectedExchange === "tokocrypto" ? "Total Transfer Amount (Incl. 0.2 Fee)" : "Total USDC Amount"}
                    </span>
                    <span className="text-base font-black text-dark-900 font-mono">
                      ${selectedExchange === "tokocrypto" 
                        ? (gig.priceUSD * groupSize + 0.2).toFixed(2) 
                        : (gig.priceUSD * groupSize).toFixed(2)} USDC
                    </span>
                    {selectedExchange === "tokocrypto" && (
                      <span className="text-[10px] text-dark-500 block font-medium mt-0.5">
                        (Escrow: ${(gig.priceUSD * groupSize).toFixed(2)} + $0.20 Tokocrypto Fee)
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const amountToCopy = selectedExchange === "tokocrypto" 
                        ? (gig.priceUSD * groupSize + 0.2).toFixed(2) 
                        : (gig.priceUSD * groupSize).toFixed(2);
                      navigator.clipboard.writeText(amountToCopy);
                      setCopiedField("amount");
                      toast.success("Total Amount copied!");
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-white border border-dark-200 hover:border-primary text-dark-800 hover:text-primary rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedField === "amount" ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Escrow Deposit Address */}
                <div className="p-3.5 bg-dark-50 rounded-2xl border border-dark-200/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-dark-450 uppercase tracking-wider block">Base Escrow Deposit Address</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Base Network (USDC)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-dark-900 font-semibold truncate">0x37da6bb53a3973dee2ed7b766f5e341ff123e8c8</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("0x37da6bb53a3973dee2ed7b766f5e341ff123e8c8");
                        setCopiedField("address");
                        toast.success("Deposit address copied!");
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="px-3 py-1.5 bg-white border border-dark-200 hover:border-primary text-dark-800 hover:text-primary rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedField === "address" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Zero-Stress Fee Buffer Tip Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Zero Gas Stress Fee Guarantee
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Withdrawal fees on Base network are minimal (~$0.10 USDC). Explomate includes an automated 1% tolerance buffer so your booking is instantly accepted even if exchange network fees are deducted!
                </p>
              </div>

              {/* TxID Submission Input */}
              <div className="space-y-2 pt-2 border-t border-dark-100">
                <label className="block text-[10px] font-bold text-dark-500 uppercase tracking-wider">
                  Withdrawal TxID / Hash from Exchange
                </label>
                <input 
                  type="text"
                  value={exchangeTxId}
                  onChange={(e) => setExchangeTxId(e.target.value)}
                  placeholder="e.g. 0x123abc456def..."
                  className="w-full p-3 border border-dark-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs text-dark-900 font-mono"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setShowExchangeModal(false);
                    setShowWalletModal(true);
                  }}
                  className="btn-outline flex-1 py-3 text-xs font-semibold"
                >
                  Back
                </button>
                <button 
                  onClick={handleExchangeConfirm}
                  disabled={isBooking || !exchangeTxId.trim()}
                  className="btn-primary flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Verify & Lock Escrow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alchemy Pay Sandbox Modal */}
      {showAlchemyPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-primary p-6 text-white text-center relative">
              <button onClick={() => { setShowAlchemyPayModal(false); setShowAlchemypayIframe(false); }} className="absolute top-4 right-4 text-white/70 hover:text-white">&times;</button>
              <h2 className="text-2xl font-black tracking-tight mb-1">Alchemy Pay</h2>
              <p className="text-white/80 text-sm">Fiat-to-Crypto Sandbox Checkout</p>
            </div>
            
            <div className="p-6 text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Alchemy Pay Under Maintenance</h3>
              <p className="text-sm text-dark-600 max-w-xs mx-auto leading-relaxed">
                Alchemy Pay is currently undergoing scheduled platform upgrades. We will be back online on <strong className="text-dark-900 font-bold">July 20, 2026</strong>.
              </p>
              <button 
                onClick={() => { setShowAlchemyPayModal(false); setShowWalletModal(true); }}
                className="w-full bg-dark-900 hover:bg-dark-950 text-white font-bold py-3 rounded-xl transition-colors text-sm cursor-pointer"
              >
                Choose Another Method
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
