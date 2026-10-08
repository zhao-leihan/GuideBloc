import { NextResponse } from "next/server";
import { syncPendingEscrowReleases } from "@/lib/crypto/escrowSync";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/escrow-sync
 * Automated background worker that reconciles and auto-releases
 * any pending or stuck on-chain escrows using relayer gas.
 */
export async function GET() {
  try {
    const result = await syncPendingEscrowReleases();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[EscrowSync Worker Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync escrows" },
      { status: 500 }
    );
  }
}
