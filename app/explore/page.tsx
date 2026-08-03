"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
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

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [country, setCountry] = useState(searchParams.get("country") || "All");
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const categoriesRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesRef.current) {
      const scrollAmount = 250;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [category, country, sortBy, minPrice, maxPrice, page]);

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      if (country && country !== "All") params.set("country", country);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("sortBy", sortBy);
      params.set("page", page.toString());

      const res = await fetch(`/api/gigs?${params}`);
      const data = await res.json();
      setGigs(data.gigs || []);
      setTotalPages(data.totalPages || 1);
      if (data.availableCountries) {
        setAvailableCountries(data.availableCountries);
      }
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

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />

      {/* Header */}
      <div className="relative bg-dark-950 overflow-hidden pt-36 pb-24">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <h1 className="text-3xl font-bold text-white mb-6">Explore Tours</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark pl-11 text-sm"
                placeholder="Search by destination, activity, or keyword..."
              />
            </div>
            <button type="submit" className="btn-primary px-8 cursor-pointer">Search</button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-white/20 text-white hover:bg-white/10 px-4 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>

          {/* Clean Category Bar */}
          <div className="relative flex items-center group/nav mb-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="absolute left-0 z-10 p-1.5 rounded-full bg-dark-900/90 border border-dark-800 shadow-md text-white hover:bg-primary transition-all opacity-0 group-hover/nav:opacity-100 -translate-x-2 backdrop-blur-sm cursor-pointer"
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
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-dark-800/80 text-white/70 hover:bg-dark-700/85"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="absolute right-0 z-10 p-1.5 rounded-full bg-dark-900/90 border border-dark-800 shadow-md text-white hover:bg-primary transition-all opacity-0 group-hover/nav:opacity-100 translate-x-2 backdrop-blur-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Filter Drawer */}
          {showFilters && (
            <div className="mt-4 p-4 bg-dark-900 rounded-xl border border-dark-800/60 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                  className="input-dark text-sm cursor-pointer"
                >
                  <option value="All">All Countries</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input-dark text-sm"
                  placeholder="$0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input-dark text-sm"
                  placeholder="$1000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-dark text-sm cursor-pointer">
                  <option value="ranking">Featured Ranking</option>
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
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
        {/* Active Filter Badges */}
        {(country !== "All" || category !== "All" || search || minPrice || maxPrice) && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-semibold text-dark-500">Active Filters:</span>
            {country !== "All" && (
              <span className="text-xs bg-dark-200 text-dark-800 font-medium px-3 py-1 rounded-full flex items-center gap-1">
                Country: {country} <X className="w-3 h-3 cursor-pointer" onClick={() => setCountry("All")} />
              </span>
            )}
            {category !== "All" && (
              <span className="text-xs bg-dark-200 text-dark-800 font-medium px-3 py-1 rounded-full flex items-center gap-1">
                Category: {category} <X className="w-3 h-3 cursor-pointer" onClick={() => setCategory("All")} />
              </span>
            )}
            {search && (
              <span className="text-xs bg-dark-200 text-dark-800 font-medium px-3 py-1 rounded-full flex items-center gap-1">
                Keyword: &quot;{search}&quot; <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
              </span>
            )}
            <button 
              onClick={() => {
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
            <h3 className="text-xl font-bold text-dark-900 mb-2">No tours found</h3>
            <p className="text-dark-500">Try adjusting your filters or search terms.</p>
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
