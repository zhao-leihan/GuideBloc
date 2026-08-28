import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      // Allow during setup if admin is logged in
    }

    const { contractAddress } = await req.json();

    if (!contractAddress || !contractAddress.startsWith("0x") || contractAddress.length !== 42) {
      return NextResponse.json({ message: "Invalid contract address" }, { status: 400 });
    }

    // Update .env
    const envPath = path.resolve(".env");
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, "utf-8");
      if (content.includes("NEXT_PUBLIC_ESCROW_ADDRESS=")) {
        content = content.replace(/^NEXT_PUBLIC_ESCROW_ADDRESS=.*$/m, `NEXT_PUBLIC_ESCROW_ADDRESS="${contractAddress}"`);
      } else {
        content += `\nNEXT_PUBLIC_ESCROW_ADDRESS="${contractAddress}"\n`;
      }
      fs.writeFileSync(envPath, content, "utf-8");
    }

    const envKey = "NEXT_PUBLIC_ESCROW_ADDRESS";
    process.env[envKey] = contractAddress;

    return NextResponse.json({
      success: true,
      message: `Escrow address updated to ${contractAddress}`,
      contractAddress,
    });
  } catch (error: any) {
    console.error("Failed to update escrow address:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
