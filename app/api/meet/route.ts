import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// 1. GET Meet Session details
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ message: "Missing bookingId" }, { status: 400 });
    }

    let meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    // If it doesn't exist, create it
    if (!meet) {
      meet = await prisma.meetSession.create({
        data: {
          bookingId,
          status: "NOT_STARTED",
        },
      });
    }

    return NextResponse.json(meet);
  } catch (error: any) {
    console.error("GET meet session error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

// 2. POST Update Coordinates
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, lat, lng } = body;

    if (!bookingId || lat === undefined || lng === undefined) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const role = (session.user as any).role; // GUIDE or TOURIST

    // Fetch existing meet session or create default
    let meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    if (!meet) {
      meet = await prisma.meetSession.create({
        data: { bookingId, status: "SHARING" },
      });
    }

    const updateData: any = {};
    if (role === "GUIDE") {
      updateData.guideLat = parseFloat(lat);
      updateData.guideLng = parseFloat(lng);
      updateData.guideLocationUpdated = new Date();
    } else {
      updateData.touristLat = parseFloat(lat);
      updateData.touristLng = parseFloat(lng);
      updateData.touristLocationUpdated = new Date();
    }

    // Determine current locations to check distance
    const tLat = role === "TOURIST" ? parseFloat(lat) : meet.touristLat;
    const tLng = role === "TOURIST" ? parseFloat(lng) : meet.touristLng;
    const gLat = role === "GUIDE" ? parseFloat(lat) : meet.guideLat;
    const gLng = role === "GUIDE" ? parseFloat(lng) : meet.guideLng;

    let newStatus = meet.status === "NOT_STARTED" ? "SHARING" : meet.status;

    if (tLat !== null && tLng !== null && gLat !== null && gLng !== null) {
      const distance = getDistance(tLat, tLng, gLat, gLng);
      // If within 50 meters, mark as ARRIVED
      if (distance < 50 && meet.status !== "COMPLETED") {
        newStatus = "ARRIVED";
      }
    }

    updateData.status = newStatus;

    const updatedMeet = await prisma.meetSession.update({
      where: { bookingId },
      data: updateData,
    });

    return NextResponse.json(updatedMeet);
  } catch (error: any) {
    console.error("POST meet location error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

// 3. PUT Upload Selfie
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, photoUrl } = body;

    if (!bookingId || !photoUrl) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const role = (session.user as any).role; // GUIDE or TOURIST

    const meet = await prisma.meetSession.findUnique({
      where: { bookingId },
    });

    if (!meet) {
      return NextResponse.json({ message: "Meet session not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (role === "GUIDE") {
      updateData.guidePhoto = photoUrl;
    } else {
      updateData.touristPhoto = photoUrl;
    }

    // Check if both photos are now present
    const tPhoto = role === "TOURIST" ? photoUrl : meet.touristPhoto;
    const gPhoto = role === "GUIDE" ? photoUrl : meet.guidePhoto;

    if (tPhoto && gPhoto) {
      updateData.status = "COMPLETED";
    }

    const updatedMeet = await prisma.meetSession.update({
      where: { bookingId },
      data: updateData,
    });

    return NextResponse.json(updatedMeet);
  } catch (error: any) {
    console.error("PUT meet verification error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
