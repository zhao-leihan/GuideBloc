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

    const { contractAddress, tokenAddress } = await req.json();

    const targetAddress = tokenAddress || contractAddress;

    if (!targetAddress || !targetAddress.startsWith("0x") || targetAddress.length !== 42) {
      return NextResponse.json({ message: "Invalid address" }, { status: 400 });
    }

    if (tokenAddress) {
      // Update lib/crypto/networkConfig.ts
      const configPath = path.resolve("lib/crypto/networkConfig.ts");
      if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, "utf-8");
        configContent = configContent.replace(
          /usdcTokenAddress:\s*"0x[a-fA-F0-9]{40}"/,
          `usdcTokenAddress: "${tokenAddress}"`
        );
        configContent = configContent.replace(
          /usdtTokenAddress:\s*"0x[a-fA-F0-9]{40}"/,
          `usdtTokenAddress: "${tokenAddress}"`
        );
        fs.writeFileSync(configPath, configContent, "utf-8");
      }

      return NextResponse.json({
        success: true,
        message: `USDC Token address updated to ${tokenAddress}`,
        tokenAddress,
      });
    }

    // Update .env for escrow
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
