import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "court"
  );
}

async function uniqueSlug(base: string) {
  let candidate = base;
  let suffix = 2;
  while (await db.pitch.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pitches = await db.pitch.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ pitches });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sport = typeof body.sport === "string" ? body.sport.trim() : "";
  const dimensions = typeof body.dimensions === "string" ? body.dimensions.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const rate = Number(body.ratePerSlot ?? body.ratePerHour);
  const order = Number.isFinite(Number(body.order)) ? Math.round(Number(body.order)) : 0;

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter a court name." }, { status: 422 });
  }
  if (!sport) {
    return NextResponse.json({ error: "Enter a sport." }, { status: 422 });
  }
  if (!Number.isFinite(rate) || rate < 0) {
    return NextResponse.json({ error: "Price must be zero or more." }, { status: 422 });
  }

  const slug = await uniqueSlug(slugify(name));

  const pitch = await db.pitch.create({
    data: {
      slug,
      name: name.slice(0, 80),
      sport: sport.slice(0, 40),
      dimensions: dimensions.slice(0, 80),
      description: description ? description.slice(0, 400) : null,
      imageUrl: imageUrl || null,
      ratePerSlot: Math.round(rate),
      order,
      active: body.active !== false,
    },
  });

  return NextResponse.json({ pitch }, { status: 201 });
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
    return NextResponse.json({ error: "Court is required." }, { status: 422 });
  }

  const pitch = await db.pitch.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!pitch) {
    return NextResponse.json({ error: "Court not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    sport?: string;
    dimensions?: string;
    description?: string | null;
    imageUrl?: string | null;
    ratePerSlot?: number;
    order?: number;
    active?: boolean;
  } = {};

  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim().slice(0, 80);
  }
  if (typeof body.sport === "string" && body.sport.trim()) {
    data.sport = body.sport.trim().slice(0, 40);
  }
  if (typeof body.dimensions === "string") {
    data.dimensions = body.dimensions.trim().slice(0, 80);
  }
  if (typeof body.description === "string") {
    const value = body.description.trim();
    data.description = value ? value.slice(0, 400) : null;
  }
  if (typeof body.imageUrl === "string") {
    data.imageUrl = body.imageUrl.trim() || null;
  }
  if (body.ratePerSlot !== undefined || body.ratePerHour !== undefined) {
    const rate = Number(body.ratePerSlot ?? body.ratePerHour);
    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json({ error: "Price must be zero or more." }, { status: 422 });
    }
    data.ratePerSlot = Math.round(rate);
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

  const updated = await db.pitch.update({ where: { id: pitch.id }, data });
  return NextResponse.json({ pitch: updated });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Court is required." }, { status: 422 });
  }

  const pitch = await db.pitch.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  if (!pitch) {
    return NextResponse.json({ error: "Court not found." }, { status: 404 });
  }

  const bookingCount = await db.booking.count({ where: { pitchId: pitch.id } });
  if (bookingCount > 0) {
    return NextResponse.json(
      {
        error:
          "This court has bookings, so it cannot be deleted. Set it to inactive to hide it from the site.",
      },
      { status: 409 }
    );
  }

  await db.pitch.delete({ where: { id: pitch.id } });
  return NextResponse.json({ ok: true });
}
