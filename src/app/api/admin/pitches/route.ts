import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

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

  const pitches = await db.pitch.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ pitches });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    id?: string;
    ratePerHour?: number;
    name?: string;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = body.id?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Pitch is required." }, { status: 422 });
  }

  const pitch = await db.pitch.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!pitch) {
    return NextResponse.json({ error: "Pitch not found." }, { status: 404 });
  }

  const data: { ratePerHour?: number; name?: string; active?: boolean } = {};

  if (body.ratePerHour !== undefined) {
    const rate = Number(body.ratePerHour);
    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json(
        { error: "Price must be zero or more." },
        { status: 422 }
      );
    }
    data.ratePerHour = Math.round(rate);
  }

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 80);
  }

  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 422 });
  }

  const updated = await db.pitch.update({ where: { id: pitch.id }, data });
  return NextResponse.json({ pitch: updated });
}
