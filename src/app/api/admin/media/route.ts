import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const media = await db.media.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ media });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const alt = typeof body.alt === "string" ? body.alt.trim() : "";
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const order = Number.isFinite(Number(body.order)) ? Math.round(Number(body.order)) : 0;
  const active = body.active !== false;

  if (!url) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 422 });
  }

  const media = await db.media.create({
    data: {
      url,
      alt: alt || null,
      caption: caption || null,
      order,
      active,
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Media item is required." }, { status: 422 });
  }

  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  }

  const data: {
    url?: string;
    alt?: string | null;
    caption?: string | null;
    order?: number;
    active?: boolean;
  } = {};

  if (typeof body.url === "string") {
    data.url = body.url.trim();
  }
  if (typeof body.alt === "string") {
    data.alt = body.alt.trim() || null;
  }
  if (typeof body.caption === "string") {
    data.caption = body.caption.trim() || null;
  }
  if (body.order !== undefined && Number.isFinite(Number(body.order))) {
    data.order = Math.round(Number(body.order));
  }
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 422 });
  }

  const updated = await db.media.update({ where: { id: media.id }, data });
  return NextResponse.json({ media: updated });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Media item is required." }, { status: 422 });
  }

  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  }

  try {
    await del(media.url);
  } catch {
    // Ignore deletion errors from blob (e.g., not managed by blob or already deleted)
  }

  await db.media.delete({ where: { id: media.id } });
  return NextResponse.json({ ok: true });
}