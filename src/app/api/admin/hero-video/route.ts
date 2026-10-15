import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BLOB_URL_PATTERN = /^https:\/\/[^\s/]+\.public\.blob\.vercel-storage\.com\/\S+$/;

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

async function deleteBlobIfExists(url: string | null) {
  if (!url || !url.startsWith("http")) return;
  try {
    await del(url);
  } catch {
    // blob already gone - nothing to clean up
  }
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const config = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ url: config?.heroVideoUrl ?? null });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { url?: unknown; remove?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const current = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  const previousUrl = current?.heroVideoUrl ?? null;

  const remove = body.remove === true || body.remove === "true";

  if (remove) {
    try {
      await db.siteConfig.upsert({
        where: { id: "singleton" },
        update: { heroVideoUrl: null },
        create: { id: "singleton" },
      });
      await deleteBlobIfExists(previousUrl);
      return NextResponse.json({ url: null });
    } catch {
      return NextResponse.json({ error: "Could not remove the video." }, { status: 500 });
    }
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!BLOB_URL_PATTERN.test(url)) {
    return NextResponse.json({ error: "Invalid video upload." }, { status: 422 });
  }

  try {
    await db.siteConfig.upsert({
      where: { id: "singleton" },
      update: { heroVideoUrl: url },
      create: { id: "singleton", heroVideoUrl: url },
    });

    if (previousUrl && previousUrl !== url) {
      await deleteBlobIfExists(previousUrl);
    }

    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the video." }, { status: 500 });
  }
}
