import { db } from "@/lib/db";
import NoticeBar from "@/components/layout/NoticeBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { FooterData } from "@/types/settings";

export const dynamic = "force-dynamic";

const FALLBACK_CONFIG = {
  siteName: "TurfHub",
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

export default async function SiteLayout({
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
    <>
      <NoticeBar text={config.noticeText} enabled={config.noticeEnabled} />
      <Header siteName={config.siteName} />
      <main className="flex-1">{children}</main>
      <Footer {...footerData} />
    </>
  );
}
