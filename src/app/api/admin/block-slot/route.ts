import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { toMinutes } from "@/lib/slot-calculator";

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

  const overrides = await db.slotOverride.findMany({
    include: { pitch: true },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
    take: 200,
  });

  return NextResponse.json({ overrides });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    pitchId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
    rateOverride?: number | null;
    blocked?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const pitchKey = body.pitchId?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const startTime = body.startTime?.trim() ?? "";
  const endTime = body.endTime?.trim() ?? "";

  if (!pitchKey || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Pitch and date are required." },
      { status: 422 }
    );
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return NextResponse.json({ error: "Invalid time range." }, { status: 422 });
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return NextResponse.json(
      { error: "End time must be after start time." },
      { status: 422 }
    );
  }

  const pitch = await db.pitch.findFirst({
    where: { OR: [{ id: pitchKey }, { slug: pitchKey }] },
  });
  if (!pitch) {
    return NextResponse.json({ error: "Pitch not found." }, { status: 404 });
  }

  const rateOverride =
    typeof body.rateOverride === "number" && body.rateOverride >= 0
      ? Math.round(body.rateOverride)
      : null;

  const isBlocked = body.blocked !== false;
  const reason = body.reason?.trim() || (isBlocked ? "Maintenance" : null);

  const override = await db.slotOverride.upsert({
    where: {
      pitchId_date_startTime: {
        pitchId: pitch.id,
        date,
        startTime,
      },
    },
    update: { endTime, isBlocked, reason, rateOverride },
    create: {
      pitchId: pitch.id,
      date,
      startTime,
      endTime,
      isBlocked,
      reason,
      rateOverride,
    },
    include: { pitch: true },
  });

  return NextResponse.json({ override }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  let id = searchParams.get("id");
  let pitchKey = searchParams.get("pitchId");
  let date = searchParams.get("date");
  let startTime = searchParams.get("startTime");

  if (!id && (!pitchKey || !date || !startTime)) {
    try {
      const body = await request.json();
      id = body.id ?? null;
      pitchKey = body.pitchId ?? null;
      date = body.date ?? null;
      startTime = body.startTime ?? null;
    } catch {
      return NextResponse.json(
        { error: "Provide an override id or pitch/date/startTime." },
        { status: 400 }
      );
    }
  }

  if (id) {
    const deleted = await db.slotOverride.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Override not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const pitch = await db.pitch.findFirst({
    where: { OR: [{ id: pitchKey! }, { slug: pitchKey! }] },
  });
  if (!pitch) {
    return NextResponse.json({ error: "Pitch not found." }, { status: 404 });
  }

  const deleted = await db.slotOverride.deleteMany({
    where: {
      pitchId: pitch.id,
      date: date!,
      startTime: startTime!,
    },
  });

  return NextResponse.json({ ok: true, deleted: deleted.count });
}
