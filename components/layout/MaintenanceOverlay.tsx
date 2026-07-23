"use client";

import { useEffect, useState } from "react";
import { Hammer, Clock, Compass } from "lucide-react";

export default function MaintenanceOverlay() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Check if hostname is not localhost (public web)
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
    
    if (!isLocal) {
      setIsMaintenance(true);
    }
  }, []);

  useEffect(() => {
    if (!isMaintenance) return;

    // Target date: July 25, 2026 at 00:00:00 Jakarta time (UTC+7)
    const targetDate = new Date("2026-07-25T00:00:00+07:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isMaintenance]);

  if (!isMaintenance) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-dark-950 text-white p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-lg bg-dark-900/40 border border-white/5 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl text-center relative shadow-2xl z-10">
        
        {/* Animated Icon Container */}
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-lg shadow-primary/5 animate-bounce">
          <Hammer className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
          Under Maintenance
        </h1>
        
        <p className="text-sm text-white/60 mb-8 leading-relaxed max-w-sm mx-auto">
          We are currently deploying the next version of Explomate. The website will be fully online on <strong className="text-white font-semibold">July 25, 2026</strong>.
        </p>

        {/* Countdown Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <span className="block text-3xl font-black text-primary font-mono">{timeLeft.days}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Days</span>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <span className="block text-3xl font-black text-white font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Hours</span>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <span className="block text-3xl font-black text-white font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Mins</span>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <span className="block text-3xl font-black text-secondary font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Secs</span>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-4">
          <Compass className="w-4 h-4" />
          <span>Explomate.ly Escrow Platform</span>
        </div>
      </div>
    </div>
  );
}
