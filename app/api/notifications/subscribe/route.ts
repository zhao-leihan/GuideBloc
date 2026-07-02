import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { message: "subscription is required" },
        { status: 400 }
      );
    }

    // In production, store the subscription in the database
    // associated with the user
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId: (session.user as any).id,
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //   }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
