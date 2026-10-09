import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import type { SiteConfig } from "@/types/settings";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG: Omit<SiteConfig, "id"> = {
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
  heroVideoUrl: null,
};

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ config: config ?? { id: "singleton", ...DEFAULT_CONFIG } });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<Omit<SiteConfig, "id">>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const timePattern = /^\d{2}:\d{2}$/;
  if (!body.siteName || !body.siteName.trim()) {
    return NextResponse.json({ error: "Website name is required." }, { status: 422 });
  }
  if (!timePattern.test(body.openingTime ?? "") || !timePattern.test(body.closingTime ?? "")) {
    return NextResponse.json(
      { error: "Opening and closing times must be HH:MM." },
      { status: 422 }
    );
  }

  const data = {
    siteName: body.siteName.trim(),
    tagline: body.tagline?.trim() || null,
    noticeText: body.noticeText?.trim() || null,
    noticeEnabled: Boolean(body.noticeEnabled),
    address: body.address?.trim() || null,
    phone: body.phone?.trim() || null,
    emergencyPhone: body.emergencyPhone?.trim() || null,
    email: body.email?.trim() || null,
    openingTime: body.openingTime!,
    closingTime: body.closingTime!,
    mapsUrl: body.mapsUrl?.trim() || null,
    facebookUrl: body.facebookUrl?.trim() || null,
    heroVideoUrl: body.heroVideoUrl?.trim() || null,
  };

  const config = await db.siteConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ config });
}
