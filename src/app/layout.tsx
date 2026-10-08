import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { db } from "@/lib/db";
import NoticeBar from "@/components/layout/NoticeBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { FooterData } from "@/types/settings";

export const dynamic = "force-dynamic";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

const FALLBACK_CONFIG = {
  siteName: "TurfHub",
  tagline: "Book your pitch. Play your game.",
  noticeText: null,
  noticeEnabled: false,
  address: null,
  phone: null,
  emergencyPhone: null,
  email: null,
  openingTime: "06:00",
  closingTime: "23:00",
  mapsUrl: null,
  facebookUrl: null,
};

async function getConfig() {
  try {
    const config = await db.siteConfig.findUnique({ where: { id: "singleton" } });
    if (config) return config;
  } catch {
    // database not reachable yet - fall back to defaults
  }
  return { id: "singleton", ...FALLBACK_CONFIG };
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: {
      default: config.siteName,
      template: `%s · ${config.siteName}`,
    },
    description: config.tagline ?? undefined,
    icons: { icon: "/favicon.svg" },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfig();

  const footerData: FooterData = {
    siteName: config.siteName,
    openingTime: config.openingTime,
    closingTime: config.closingTime,
    address: config.address,
    phone: config.phone,
    emergencyPhone: config.emergencyPhone,
    email: config.email,
    mapsUrl: config.mapsUrl,
  };

  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-charcoal">
        <NoticeBar text={config.noticeText} enabled={config.noticeEnabled} />
        <Header siteName={config.siteName} />
        <main className="flex-1">{children}</main>
        <Footer {...footerData} />
      </body>
    </html>
  );
}