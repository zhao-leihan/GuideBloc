import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    if (path.startsWith("/dashboard/guide") && token?.role !== "GUIDE" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/dashboard/tourist") && token?.role !== "TOURIST" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
