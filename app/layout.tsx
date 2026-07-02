import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Explomate | Explore the World,Pay in the Future",
  description: "Connect with local tour guides worldwide. Book unique experiences and pay with USDT/USDC.",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
