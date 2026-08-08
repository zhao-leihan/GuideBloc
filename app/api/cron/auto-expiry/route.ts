import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cron Job Endpoint to auto-expire PENDING bookings older than 30 minutes.
 * Logs expired bookings to payment_audit_logs.
 */
export async function GET(req: Request) {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: thirtyMinsAgo }
      },
      select: { id: true }
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: "No expired bookings found.", expiredCount: 0 });
    }

    const expiredIds = expiredBookings.map((b) => b.id);

    // Update status to EXPIRED
    const updateRes = await prisma.booking.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" }
    });

    // Create Audit Log Entries
    await prisma.paymentAuditLog.createMany({
      data: expiredIds.map((id) => ({
        bookingId: id,
        source: "CRON_EXPIRY",
        status: "EXPIRED",
        errorMessage: "Booking auto-expired after 30 minutes inactivity."
      }))
    });

    return NextResponse.json({
      success: true,
      message: `Successfully auto-expired ${updateRes.count} pending bookings.`,
      expiredCount: updateRes.count
    });
  } catch (error: any) {
    console.error("[Cron Auto-Expiry Error]", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
