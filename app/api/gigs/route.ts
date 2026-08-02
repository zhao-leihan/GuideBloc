import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateGigRankingScore } from "@/lib/ranking";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const country = searchParams.get("country") || "";
    const region = searchParams.get("region") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "ranking";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const guideId = searchParams.get("guideId");

    const where: any = { isActive: true };

    if (guideId) {
      where.guideId = guideId;
      delete where.isActive; // guides can manage inactive gigs
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) where.category = { equals: category, mode: "insensitive" };
    
    if (country && country !== "All") {
      where.country = { contains: country, mode: "insensitive" };
    } else if (region && region !== "All") {
      const regionCountriesMap: Record<string, string[]> = {
        "Southeast Asia": ["Indonesia", "Thailand", "Vietnam", "Singapore", "Malaysia", "Philippines", "Bali"],
        "East Asia": ["Japan", "South Korea", "China", "Taiwan", "Hong Kong", "Tokyo", "Seoul"],
        "Europe": ["France", "Italy", "Spain", "United Kingdom", "Greece", "Switzerland", "Netherlands", "Germany", "Paris", "Rome"],
        "Americas": ["United States", "Canada", "Mexico", "Brazil", "Peru", "Argentina", "New York"],
        "Middle East & Africa": ["United Arab Emirates", "Egypt", "Saudi Arabia", "Turkey", "Morocco", "Dubai"],
        "Oceania": ["Australia", "New Zealand", "Sydney"],
      };
      
      const targetCountries = regionCountriesMap[region];
      if (targetCountries && targetCountries.length > 0) {
        where.OR = [
          ...(where.OR || []),
          ...targetCountries.map(c => ({ country: { contains: c, mode: "insensitive" } })),
          ...targetCountries.map(c => ({ location: { contains: c, mode: "insensitive" } })),
        ];
      }
    }

    if (minPrice || maxPrice) {
      where.priceUSD = {};
      if (minPrice) where.priceUSD.gte = parseFloat(minPrice);
      if (maxPrice) where.priceUSD.lte = parseFloat(maxPrice);
    }

    // Fetch distinct active countries from DB
    const dbCountries = await prisma.gig.findMany({
      where: { isActive: true },
      select: { country: true },
      distinct: ["country"],
    });
    const availableCountries = Array.from(new Set(dbCountries.map(g => g.country).filter(Boolean)));

    // Fetch all matching gigs
    const allGigs = await prisma.gig.findMany({
      where,
      include: {
        guide: { select: { id: true, name: true, avatar: true, country: true } },
      },
    });

    // 1. Sort based on criteria
    const sortFunctions: Record<string, (a: any, b: any) => number> = {
      newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      price_asc: (a, b) => a.priceUSD - b.priceUSD,
      price_desc: (a, b) => b.priceUSD - a.priceUSD,
      rating: (a, b) => b.avgRating - a.avgRating || b.ranking_score - a.ranking_score,
      popular: (a, b) => b.booking_count - a.booking_count || b.ranking_score - a.ranking_score,
      ranking: (a, b) => b.ranking_score - a.ranking_score || b.avgRating - a.avgRating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    };

    const sortFn = sortFunctions[sortBy] || sortFunctions.ranking;
    const sortedGigs = [...allGigs].sort(sortFn);

    // 2. Prepend active boosted gigs (featured_until is in the future) to the top
    const now = new Date();
    const featuredGigs = sortedGigs.filter(g => g.featured_until && new Date(g.featured_until) > now);
    const regularGigs = sortedGigs.filter(g => !g.featured_until || new Date(g.featured_until) <= now);
    
    const finalGigs = [...featuredGigs, ...regularGigs];

    // 3. Paginate
    const total = finalGigs.length;
    const paginatedGigs = finalGigs.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      gigs: paginatedGigs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      availableCountries,
    });
  } catch (error) {
    console.error("Gigs GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "GUIDE" && user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only guides can create gigs" }, { status: 403 });
    }

    const data = await req.json();

    // Platform fee system
    // Guide wants to earn guide_price.
    // Client price paid by tourist is client_price = guide_price / 0.90
    // Platform fee is platform_fee = client_price - guide_price
    const guide_price = parseFloat(data.guide_price || data.priceUSD || "0");
    const client_price = guide_price / 0.90;
    const platform_fee = client_price - guide_price;

    const gig = await prisma.gig.create({
      data: {
        ...data,
        guide_price,
        client_price,
        platform_fee,
        priceUSD: client_price, // fallback for legacy code
        guideId: user.id,
      },
    });

    // Calculate initial ranking score
    await recalculateGigRankingScore(gig.id);

    // Fetch newly created gig with updated score
    const updatedGig = await prisma.gig.findUnique({
      where: { id: gig.id }
    });

    return NextResponse.json(updatedGig, { status: 201 });
  } catch (error) {
    console.error("Gigs POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
