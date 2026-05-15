import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthHydrator from "@/components/auth/AuthHydrator";
import MaintenanceGate from "@/components/auth/MaintenanceGate";
import ChatWidget from "@/components/ai/ChatWidget";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pokhara Tours and Travel — Discover the heart of Nepal",
  description:
    "Plan unforgettable journeys to Pokhara, Annapurna, Everest, Chitwan and beyond. Curated tour packages, expert guides, and 24/7 support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-ink">
        <AuthHydrator />
        <MaintenanceGate>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </MaintenanceGate>
      </body>
    </html>
  );
}
