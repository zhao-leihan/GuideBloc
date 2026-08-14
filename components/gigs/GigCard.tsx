"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Users, MapPin } from "lucide-react";
import { formatCurrency, getCountryFlag } from "@/lib/utils";
import { CategoryIcon } from "@/components/icons/CategoryIcon";

interface GigCardProps {
  gig: {
    id: string;
    title: string;
    location: string;
    country: string;
    category: string;
    durationHours: number;
    priceUSD: number;
    images: string[];
    guide: { name: string; avatar: string | null; country: string | null };
    avgRating?: number;
    reviewCount?: number;
    maxGroupSize: number;
  };
}

export default function GigCard({ gig }: GigCardProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const updateThemeState = () => {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      setIsDarkTheme(hasDarkClass);
    };

    updateThemeState();

    const observer = new MutationObserver(updateThemeState);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["class"] 
    });

    return () => observer.disconnect();
  }, []);

  const getBadgeStyle = () => {
    if (isDarkTheme) {
      return {
        backgroundColor: "#1e293b",
        color: "#38bdf8",
        border: "1px solid rgba(56, 189, 248, 0.4)",
        fontWeight: 700
      };
    } else {
      return {
        backgroundColor: "#e8effe",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
        fontWeight: 700
      };
    }
  };

  return (
    <Link href={`/gigs/${gig.id}`} className="card group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={gig.images[0] || "/assets/placeholder.jpg"}
          alt={gig.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm" style={getBadgeStyle()}>
            <CategoryIcon category={gig.category} className="w-3.5 h-3.5" /> {gig.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm" style={getBadgeStyle()}>
            ≈ {gig.priceUSD.toFixed(0)} USDT
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Guide */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            {gig.guide.avatar ? (
              <img src={gig.guide.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <span className="text-xs text-primary font-bold">{gig.guide.name[0]}</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold border border-white" title="Verified Local Guide">✓</span>
          </div>
          <span className="text-xs text-dark-700 font-semibold">{gig.guide.name}</span>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20">Verified</span>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-dark-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {gig.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-dark-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{gig.location}</span>
          <span className="text-xs font-mono bg-dark-100 px-1 rounded">{getCountryFlag(gig.country)}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{gig.durationHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Max {gig.maxGroupSize}</span>
          </div>
          {gig.avgRating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-dark-700 font-medium">{gig.avgRating}</span>
              <span className="text-dark-300">({gig.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-100">
          <div>
            <span className="text-lg font-bold text-dark-900">{formatCurrency(gig.priceUSD)}</span>
            <span className="text-xs text-dark-400 ml-1">/ person</span>
          </div>
          <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
