"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3-second elegant loading period
    const timer = setTimeout(() => {
      setLoading(false);
      if (onComplete) {
        onComplete();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          // Exit with a smooth, slow fade-out (opacity only, no slide-up) over 1.2 seconds
          exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-dark-950 text-white"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 text-center px-4"
          >
            {/* Logo Image with pulsing glowing back drop */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-150" />
              <motion.img 
                src="/assets/Navbar-logo.webp" 
                alt="explomate Logo" 
                className="relative h-16 md:h-20 w-auto object-contain"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-xs text-dark-300 tracking-widest uppercase font-medium"
            >
              Explore the World. Pay in the Future.
            </motion.p>
            
            {/* Elegant Luxury Spinner */}
            <div className="relative w-8 h-8 mt-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-[3px] border-primary-800 border-t-secondary rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
