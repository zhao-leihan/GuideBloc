"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Grid, Map, X, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GigCard from "@/components/gigs/GigCard";

const categories = [
  "All",
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

const regions = [
  { id: "All", name: "All Regions", icon: "🌍" },
  { id: "Southeast Asia", name: "Southeast Asia", icon: "🌴" },
  { id: "East Asia", name: "East Asia", icon: "⛩️" },
  { id: "Europe", name: "Europe", icon: "🏰" },
  { id: "Americas", name: "Americas", icon: "🗽" },
  { id: "Middle East & Africa", name: "Middle East & Africa", icon: "🕌" },
  { id: "Oceania", name: "Oceania", icon: "🦘" },
];

const countries = [
  { name: "All", flag: "🌐", region: "All" },
  { name: "Indonesia", flag: "🇮🇩", region: "Southeast Asia" },
  { name: "Japan", flag: "🇯🇵", region: "East Asia" },
  { name: "South Korea", flag: "🇰🇷", region: "East Asia" },
  { name: "Thailand", flag: "🇹🇭", region: "Southeast Asia" },
  { name: "France", flag: "🇫🇷", region: "Europe" },
  { name: "Italy", flag: "🇮🇹", region: "Europe" },
  { name: "Spain", flag: "🇪🇸", region: "Europe" },
  { name: "United States", flag: "🇺🇸", region: "Americas" },
  { name: "United Arab Emirates", flag: "🇦🇪", region: "Middle East & Africa" },
  { name: "United Kingdom", flag: "🇬🇧", region: "Europe" },
  { name: "Switzerland", flag: "🇨🇭", region: "Europe" },
  { name: "Australia", flag: "🇦🇺", region: "Oceania" },
  { name: "Egypt", flag: "🇪🇬", region: "Middle East & Africa" },
  { name: "Mexico", flag: "🇲🇽", region: "Americas" },
  { name: "Brazil", flag: "🇧🇷", region: "Americas" },
  { name: "Turkey", flag: "🇹🇷", region: "Middle East & Africa" },
  { name: "Vietnam", flag: "🇻🇳", region: "Southeast Asia" },
  { name: "Singapore", flag: "🇸🇬", region: "Southeast Asia" },
  { name: "Malaysia", flag: "🇲🇾", region: "Southeast Asia" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [region, setRegion] = useState(searchParams.get("region") || "All");
  const [country, setCountry] = useState(searchParams.get("country") || "All");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 260;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [category, region, country, sortBy, minPrice, maxPrice, page]);

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      if (region && region !== "All") params.set("region", region);
      if (country && country !== "All") params.set("country", country);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("sortBy", sortBy);
      params.set("page", page.toString());

      const res = await fetch(`/api/gigs?${params}`);
      const data = await res.json();
      setGigs(data.gigs || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGigs();
  };

  const filteredCountries = region === "All" 
    ? countries 
    : countries.filter(c => c.name === "All" || c.region === region);

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Header & Global Search */}
      <div className="relative bg-dark-950 overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Explore Worldwide Tours <Globe className="w-6 h-6 text-primary animate-pulse" />
              </h1>
              <p className="text-sm text-dark-300 mt-1">Discover authentic local experiences across 6 continents and 20+ countries</p>
            </div>

            {/* Filter Toggle Badge */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="self-start md:self-auto border border-white/20 hover:border-primary text-white hover:bg-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium text-xs backdrop-blur-md cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Advanced Filters</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2.5 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark pl-11"
                placeholder="Search by destination (e.g. Bali, Tokyo, Paris, Dubai), activity, or guide..."
              />
            </div>
            <button type="submit" className="btn-primary px-8">Search</button>
          </form>

          {/* 1. Continents / Regions Selector Row */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-2">1. Select Region / Continent:</span>
            <div className="flex flex-wrap gap-2">
              {regions.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => {
                    setRegion(reg.id);
                    setCountry("All");
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    region === reg.id
                      ? "bg-primary text-white shadow-lg shadow-primary/25 border border-primary"
                      : "bg-dark-900/80 text-white/80 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span>{reg.icon}</span>
                  <span>{reg.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Countries Selector Row (with Flag Badges) */}
          <div className="mb-4 relative group/countries">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">2. Select Country:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => scrollContainer(countriesRef, "left")}
                  className="p-1 rounded-lg bg-dark-900 text-white hover:bg-primary transition-all text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollContainer(countriesRef, "right")}
                  className="p-1 rounded-lg bg-dark-900 text-white hover:bg-primary transition-all text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              ref={countriesRef}
              className="flex gap-2 overflow-x-auto py-1 no-scrollbar w-full"
            >
              {filteredCountries.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setCountry(c.name); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    country === c.name
                      ? "bg-white text-dark-900 shadow-md font-bold"
                      : "bg-dark-900/60 text-white/70 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category Filter Scrollbar */}
          <div className="relative flex items-center group/nav">
            <button
              type="button"
              onClick={() => scrollContainer(categoriesRef, "left")}
              className="absolute left-0 z-10 p-1.5 rounded-full bg-dark-900/90 border border-dark-800 shadow-md text-white hover:bg-primary transition-all opacity-0 group-hover/nav:opacity-100 -translate-x-2 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={categoriesRef}
              className="flex gap-2 overflow-x-auto py-1 no-scrollbar w-full"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-dark-800/80 text-white/70 hover:bg-dark-700/85"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollContainer(categoriesRef, "right")}
              className="absolute right-0 z-10 p-1.5 rounded-full bg-dark-900/90 border border-dark-800 shadow-md text-white hover:bg-primary transition-all opacity-0 group-hover/nav:opacity-100 translate-x-2 backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Advanced Filters Drawer */}
          {showFilters && (
            <div className="mt-4 p-5 bg-dark-900 rounded-2xl border border-dark-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-dark-300 mb-1">Region / Continent</label>
                <select
                  value={region}
                  onChange={(e) => { setRegion(e.target.value); setCountry("All"); setPage(1); }}
                  className="input-dark text-xs"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-300 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                  className="input-dark text-xs"
                >
                  {filteredCountries.map((c) => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-300 mb-1">Min Price (USD)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input-dark text-xs"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-300 mb-1">Max Price (USD)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input-dark text-xs"
                  placeholder="$1000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-300 mb-1">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-dark text-xs">
                  <option value="ranking">⭐ Featured Ranking</option>
                  <option value="newest">🆕 Newest First</option>
                  <option value="price_asc">💵 Price: Low to High</option>
                  <option value="price_desc">💎 Price: High to Low</option>
                  <option value="rating">🔥 Highest Rated</option>
                  <option value="popular">🚀 Most Popular</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SVG Curved Wave Divider */}
        <div className="absolute bottom-[-1px] left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.33,90,26.9,165.73,46.56,252.1,69.28,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filter Badges Display */}
        {(region !== "All" || country !== "All" || category !== "All" || search) && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-bold text-dark-500">Active Filters:</span>
            {region !== "All" && (
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                Region: {region} <X className="w-3 h-3 cursor-pointer" onClick={() => setRegion("All")} />
              </span>
            )}
            {country !== "All" && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                Country: {country} <X className="w-3 h-3 cursor-pointer" onClick={() => setCountry("All")} />
              </span>
            )}
            {category !== "All" && (
              <span className="text-xs bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                Category: {category} <X className="w-3 h-3 cursor-pointer" onClick={() => setCategory("All")} />
              </span>
            )}
            {search && (
              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                Keyword: "{search}" <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
              </span>
            )}
            <button 
              onClick={() => {
                setRegion("All");
                setCountry("All");
                setCategory("All");
                setSearch("");
                setMinPrice("");
                setMaxPrice("");
                setPage(1);
              }}
              className="text-xs text-dark-400 hover:text-dark-900 underline font-medium cursor-pointer ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-52 bg-dark-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-dark-200 rounded w-1/3" />
                  <div className="h-5 bg-dark-200 rounded w-2/3" />
                  <div className="h-4 bg-dark-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : gigs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-ghost text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-primary text-white"
                        : "text-dark-600 hover:bg-dark-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-ghost text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-xl font-bold text-dark-900 mb-2">No tours found for this destination</h3>
            <p className="text-dark-500">Try selecting another country or region, or clear your active filters.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
