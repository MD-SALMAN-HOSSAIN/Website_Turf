import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { db } from "@/lib/db";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-charcoal">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("theme")==="light"){document.documentElement.classList.add("light");}}catch(e){}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
