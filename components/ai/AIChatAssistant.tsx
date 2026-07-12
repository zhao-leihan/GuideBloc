"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Loader2, ArrowRight, Calendar, Users, ShieldAlert, CreditCard } from "lucide-react";
import PaymentModal from "../payment/PaymentModal";
import toast from "react-hot-toast";

interface Message {
  sender: "user" | "ai";
  text: string;
  sticker?: string;
  action?: "NONE" | "SEARCH" | "BOOK" | "PAY";
  actionData?: any;
  gigs?: any[];
  bookingId?: string;
  paymentConfirmed?: boolean;
}

export default function AIChatAssistant({ initialQuery = "", onCloseInput }: { initialQuery?: string; onCloseInput?: () => void }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Payment Modal integration state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<{
    bookingId: string;
    gigTitle: string;
    amount: number;
    token: "USDT" | "USDC";
  } | null>(null);

  // If homepage pre-fills a query
  useEffect(() => {
    if (initialQuery) {
      setIsOpen(true);
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: "ai",
          sticker: "/assets/emote.png",
          text: "",
        },
        {
          sender: "ai",
          text: `Hi! I'm **Kira**, your personal AI travel companion at Explomate! ✨🌴\n\nI'm super excited to help you discover beautiful spots, connect with local guides, and handle payments securely on-chain. 🎒💸\n\nWhat kind of adventure are we looking for today?`,
        },
      ]);
    }
    scrollToBottom();
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    if (!textToSend) setInput("");

    // Add user message
    const userMsg: Message = { sender: "user", text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact Kira");
      }

      const data = await response.json();

      let gigsResult: any[] = [];
      // If AI triggers SEARCH, fetch gigs dynamically from the backend
      if (data.action === "SEARCH" && data.actionData?.searchQuery) {
        try {
          const gigsRes = await fetch(`/api/gigs?search=${encodeURIComponent(data.actionData.searchQuery)}`);
          if (gigsRes.ok) {
            const resData = await gigsRes.json();
            gigsResult = resData.gigs || [];
          }
        } catch (err) {
          console.error("Error fetching matching gigs:", err);
        }
      }

      const aiMsg: Message = {
        sender: "ai",
        text: data.reply,
        action: data.action,
        actionData: data.actionData,
        gigs: gigsResult,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I lost my connection to the ship! Please try sending that again." },
      ]);
    } finally {
      setLoading(false);
      onCloseInput?.();
    }
  };

  // Perform booking creation on-demand
  const handleConfirmBooking = async (gigId: string, bookingDate: string, groupSize: number, msgIndex: number) => {
    if (!session) {
      toast.error("Please log in or register to complete your booking with Kira!");
      setTimeout(() => {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      }, 1500);
      return;
    }

    toast.loading("Verifying your profile details...");
    try {
      const profileRes = await fetch("/api/users/profile");
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (!profile.passportNumber && !profile.idCardNumber) {
          toast.dismiss();
          toast.error("Please complete your profile details (Passport or ID Card) first!");
          setTimeout(() => {
            window.location.href = "/dashboard/tourist/profile";
          }, 2000);
          return;
        }
      }
    } catch (err) {
      console.error("Profile check error:", err);
    }

    toast.loading("Creating your booking in our database...");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId,
          bookingDate,
          groupSize,
          cryptoToken: "USDT",
        }),
      });

      toast.dismiss();
      if (res.ok) {
        const booking = await res.json();
        toast.success("Booking created! Proceed to payment.");

        // Update current message to show booking is created
        setMessages((prev) => {
          const updated = [...prev];
          updated[msgIndex] = {
            ...updated[msgIndex],
            bookingId: booking.id,
            text: `Awesome! I have successfully reserved this tour for you in our database (Booking ID: ${booking.id}).\n\nClick the button below to pay **${Number(booking.totalPriceUSD).toFixed(2)} USDT** on Base network via your crypto wallet.`,
            action: "PAY",
            actionData: {
              bookingId: booking.id,
              gigTitle: booking.gig?.title || "Reserved Tour",
              amount: booking.totalPriceUSD,
              token: booking.cryptoToken || "USDT",
            },
          };
          return updated;
        });
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to create booking.");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to create booking.");
    }
  };

  const handlePaymentSuccess = async (txHash: string) => {
    if (!activePayment) return;
    toast.loading("Verifying block transaction...");

    try {
      const res = await fetch(`/api/bookings/${activePayment.bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          txHash,
          paymentNetwork: "base",
        }),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success("Payment confirmed!");
        // Update the payment message in history to show success
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `ðŸŽ‰ **Success!** Payment of **${activePayment.amount} ${activePayment.token}** has been confirmed on-chain.\n\nTx Hash: \`${txHash.slice(0, 10)}...${txHash.slice(-8)}\`.\n\nYour guide has been notified and funds are securely locked in escrow. Have an amazing tour!`,
            paymentConfirmed: true,
          },
        ]);
        setPayModalOpen(false);
        setActivePayment(null);
      } else {
        toast.error("Payment verified on chain but status update failed.");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Payment status synchronization failed.");
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2.5 px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-full shadow-2xl border border-white/10 relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-35 group-hover:opacity-60 transition-opacity -z-10" />
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
            <img src="/assets/michelle.webp" alt="Kira" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-wide font-sans text-white relative z-10">Ask Kira</span>
        </motion.button>
      </div>

      {/* Slide-out Chat Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-140px)] bg-dark-900/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between bg-dark-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-transparent">
                  <img src="/assets/michelle.webp" alt="Kira" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white text-sm">Kira</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-dark-400 font-medium uppercase tracking-wide">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCloseInput?.();
                }}
                className="text-dark-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.sender === "user";
                const isStickerOnly = msg.sticker && !msg.text;

                return (
                  <div key={index} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    {isStickerOnly ? (
                      <div className="max-w-[120px] rounded-xl overflow-hidden mb-1">
                        <img src={msg.sticker} alt="Sticker" className="w-full h-auto object-contain" />
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-dark-800 text-dark-100 rounded-tl-none border border-dark-700/40"
                        }`}
                      >
                        {msg.sticker && (
                          <div className="mb-2 max-w-[120px] rounded-lg overflow-hidden">
                            <img src={msg.sticker} alt="Sticker" className="w-full h-auto object-contain" />
                          </div>
                        )}
                        {/* Render markdown text simply */}
                        <div className="whitespace-pre-wrap font-sans">
                      {msg.text.split("\n\n").map((para, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>
                          {para.split("**").map((chunk, j) => (j % 2 === 1 ? <strong key={j} className="text-primary-300 font-bold">{chunk}</strong> : chunk))}
                        </p>
                      ))}
                    </div>

                    {/* Inline Cards based on structured actions */}

                    {/* 1. SEARCH ACTION RESULT CARDS */}
                    {msg.action === "SEARCH" && msg.gigs && msg.gigs.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-dark-700/60 pt-3">
                        <p className="text-[11px] text-dark-400 uppercase font-bold tracking-wider">Matching Tours:</p>
                        {msg.gigs.map((g) => (
                          <div key={g.id} className="bg-dark-900 border border-dark-700 rounded-xl p-3 flex gap-3 hover:border-primary/50 transition-colors">
                            {g.images?.[0] && (
                              <img src={g.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-white text-xs truncate">{g.title}</h5>
                              <p className="text-[10px] text-dark-400 truncate">{g.location}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-bold text-primary-300">{parseFloat(g.client_price || g.priceUSD || "0").toFixed(2)} USDT</span>
                                <button
                                  onClick={() => handleConfirmBooking(g.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], 1, index)}
                                  className="text-[10px] font-bold text-white bg-primary hover:bg-primary-600 px-2.5 py-1 rounded-md flex items-center gap-1 transition-all"
                                >
                                  Book <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. BOOK ACTION CONFIRMATION CARD */}
                    {msg.action === "BOOK" && msg.actionData?.gigId && !msg.bookingId && (
                      <div className="mt-3 border-t border-dark-700/60 pt-3 space-y-2">
                        <div className="bg-dark-900 border border-primary/20 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-semibold text-white">Booking Details</span>
                          </div>
                          <div className="text-xs text-dark-300 space-y-1">
                            <p>ðŸ“… Date: <strong>{msg.actionData.bookingDate || "Next week"}</strong></p>
                            <p>ðŸ‘¥ Guests: <strong>{msg.actionData.groupSize || 1} Participant(s)</strong></p>
                          </div>
                          <button
                            onClick={() =>
                              handleConfirmBooking(
                                msg.actionData.gigId,
                                msg.actionData.bookingDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                msg.actionData.groupSize || 1,
                                index
                              )
                            }
                            className="w-full btn-primary py-1.5 text-xs flex items-center justify-center gap-1"
                          >
                            Confirm Booking & Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. PAY ACTION CARD */}
                    {msg.action === "PAY" && msg.actionData?.bookingId && (
                      <div className="mt-3 border-t border-dark-700/60 pt-3">
                        <div className="bg-dark-900 border border-secondary/35 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2 text-secondary">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs font-semibold text-white">Secure Escrow Payment</span>
                          </div>
                          <div className="text-xs text-dark-300">
                            <p>Tour: <strong>{msg.actionData.gigTitle}</strong></p>
                            <p>Amount: <strong>{Number(msg.actionData.amount).toFixed(2)} {msg.actionData.token}</strong></p>
                            <p className="text-[10px] text-dark-400 mt-1">Locked in escrow on Base network.</p>
                          </div>
                          <button
                            onClick={() => {
                              setActivePayment({
                                bookingId: msg.actionData.bookingId,
                                gigTitle: msg.actionData.gigTitle,
                                amount: msg.actionData.amount,
                                token: msg.actionData.token,
                              });
                              setPayModalOpen(true);
                            }}
                            className="w-full bg-secondary hover:bg-secondary-600 text-white rounded-lg py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-secondary/25"
                          >
                            Pay {Number(msg.actionData.amount).toFixed(2)} {msg.actionData.token} Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-transparent flex-shrink-0 animate-pulse">
                    <img src="/assets/michelle.webp" alt="Kira" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-dark-800 text-dark-300 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2 border border-dark-700/40">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span>Kira is searching the map...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-dark-700/50 bg-dark-950 flex gap-2">
              <input
                type="text"
                placeholder="Ask Kira about Bali tours..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                disabled={loading}
                className="flex-1 bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary disabled:opacity-50 font-sans"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary-600 text-white p-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Payment Modal trigger */}
      {activePayment && (
        <PaymentModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          amount={activePayment.amount}
          token={activePayment.token}
          gigTitle={activePayment.gigTitle}
          bookingDate="Direct from AI Assistant"
          onConfirm={handlePaymentSuccess}
        />
      )}
    </>
  );
}
