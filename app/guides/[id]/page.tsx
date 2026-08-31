import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Star, MapPin, Globe, Calendar, ShieldCheck, Award, MessageSquare, 
  Clock, Users, Sparkles, CheckCircle2, ChevronRight, Compass, Shield
} from "lucide-react";
import Link from "next/link";
import { getCountryFlag, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuideProfilePage({ params }: { params: { id: string } }) {
  const guide = await prisma.user.findFirst({
    where: {
      OR: [
        { id: params.id },
        { email: params.id },
      ],
      role: { in: ["GUIDE", "ADMIN"] },
    },
    include: {
      gigs: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
          gig: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!guide) {
    notFound();
  }

  const reviewCount = guide.reviewsReceived.length;
  const avgRating = reviewCount > 0
    ? guide.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / reviewCount
    : 5.0;

  const languages = Array.isArray(guide.language) && guide.language.length > 0
    ? guide.language
    : ["English", "Indonesian"];

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-dark-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/explore" className="hover:text-primary">Guides</Link>
            <span>/</span>
            <span className="text-dark-900 font-semibold">{guide.name}</span>
          </nav>

          {/* Guide Hero Profile Card */}
          <div className="card p-6 sm:p-8 bg-white border border-dark-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              {/* Left Column: Avatar + Basic Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-extrabold shadow-md overflow-hidden border-2 border-white">
                    {guide.avatar ? (
                      <img src={guide.avatar} alt={guide.name} className="w-full h-full object-cover" />
                    ) : (
                      guide.name[0]?.toUpperCase() || "G"
                    )}
                  </div>
                  <span 
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm" 
                    title="Verified Local Guide"
                  >
                    ✓
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-dark-900">
                      {guide.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Local Guide
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      Level {guide.level || 1} • {guide.xp || 0} XP
                    </span>
                  </div>

                  <p className="text-sm text-dark-500 flex items-center gap-2 font-medium">
                    <span>{guide.country || "Indonesia"} {getCountryFlag(guide.country || "Indonesia")}</span>
                    <span>•</span>
                    <span>Joined {new Date(guide.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </p>

                  {/* Rating & Review Counter */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
                    <div className="flex items-center gap-1.5 font-bold text-dark-900">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-dark-400 font-normal">
                        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-dark-600 text-xs font-semibold">
                      <Compass className="w-4 h-4 text-primary" />
                      <span>{guide.gigs.length} Hosted Tour Experience{guide.gigs.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Contact CTA */}
              <div className="flex sm:flex-col items-center sm:items-end gap-3 self-stretch sm:self-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-dark-100">
                <Link
                  href="/dashboard/tourist/messages"
                  className="btn-primary text-sm w-full sm:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Message Guide
                </Link>
                <span className="text-[11px] text-dark-400 font-medium hidden sm:inline-block">
                  Usually replies within 1 hour
                </span>
              </div>
            </div>

            {/* Bio & Details Grid */}
            <div className="mt-8 pt-6 border-t border-dark-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* About Bio */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-dark-900 uppercase tracking-wider">
                  About the Guide
                </h3>
                <p className="text-sm text-dark-600 leading-relaxed whitespace-pre-line">
                  {guide.bio || `${guide.name} is a passionate, background-checked local guide dedicated to providing authentic travel experiences, hidden gems, and cultural storytelling.`}
                </p>

                {guide.certificationText && (
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 mt-2">
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Official License / Certification</p>
                      <p className="text-indigo-700">{guide.certificationText}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Spoken Languages & Verified Badges */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-dark-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary" /> Spoken Languages
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-dark-900 uppercase tracking-wider mb-2">
                    Verified Credentials
                  </h3>
                  <ul className="space-y-1.5 text-xs text-dark-600">
                    <li className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Identity Verified
                    </li>
                    <li className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Decentralized Escrow Guarantee
                    </li>
                    <li className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Background Checked
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Hosted Tours & Experiences (REAL GIGS LIST) */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-dark-900">
                  Tours & Experiences by {guide.name}
                </h2>
                <p className="text-xs sm:text-sm text-dark-500 mt-0.5">
                  Book direct with decentralized smart contract protection
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-dark-100 text-dark-700">
                {guide.gigs.length} Tour{guide.gigs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {guide.gigs.length === 0 ? (
              <div className="card p-12 text-center text-dark-400 space-y-2">
                <Compass className="w-10 h-10 text-dark-300 mx-auto" />
                <p className="text-sm font-semibold text-dark-700">No active tours published yet.</p>
                <p className="text-xs text-dark-400">This guide is currently crafting new exciting itineraries. Stay tuned!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {guide.gigs.map((tour) => {
                  const coverImage = tour.images && tour.images.length > 0 
                    ? tour.images[0] 
                    : "/assets/placeholder.jpg";
                  const tourPrice = tour.client_price || tour.priceUSD;

                  return (
                    <div
                      key={tour.id}
                      className="card overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between border border-dark-100"
                    >
                      <div>
                        {/* Image Cover */}
                        <div className="relative aspect-video overflow-hidden bg-dark-100">
                          <img
                            src={coverImage}
                            alt={tour.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-white/90 backdrop-blur-xs text-dark-900 shadow-xs uppercase tracking-wider">
                            {tour.category}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs text-dark-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {tour.durationHours}h
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Max {tour.maxGroupSize}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {tour.location}
                            </span>
                          </div>

                          <h3 className="font-bold text-dark-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {tour.title}
                          </h3>

                          <p className="text-xs text-dark-600 line-clamp-2 leading-relaxed">
                            {tour.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 pb-5 pt-3 border-t border-dark-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-dark-400 block">From</span>
                          <span className="text-lg font-black text-dark-900">
                            {formatCurrency(tourPrice)}
                          </span>
                          <span className="text-[10px] text-dark-400 font-medium"> / person</span>
                        </div>

                        <Link
                          href={`/gigs/${tour.id}`}
                          className="btn-primary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 font-bold shadow-xs"
                        >
                          View Tour <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Tourist Reviews */}
          <div className="space-y-4 pt-4 border-t border-dark-100">
            <h2 className="text-xl sm:text-2xl font-black text-dark-900 flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Verified Tourist Reviews ({reviewCount})
            </h2>

            {reviewCount === 0 ? (
              <div className="card p-8 text-center text-xs text-dark-500">
                No reviews yet. Be among the first tourists to explore with {guide.name}!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.reviewsReceived.map((review) => (
                  <div key={review.id} className="card p-5 space-y-3 bg-white border border-dark-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm overflow-hidden">
                          {review.reviewer.avatar ? (
                            <img src={review.reviewer.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.reviewer.name[0]
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-dark-900">{review.reviewer.name}</p>
                          <p className="text-[10px] text-dark-400">{review.gig?.title || "Tour Experience"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? "fill-amber-400 text-amber-400" : "text-dark-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-dark-700 leading-relaxed">
                      &quot;{review.comment}&quot;
                    </p>

                    <p className="text-[10px] text-dark-400">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
