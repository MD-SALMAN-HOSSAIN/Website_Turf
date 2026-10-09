import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import type { BookingStatus } from "@/types/booking";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { status?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  }

  const existing = await db.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const booking = await db.booking.update({
    where: { id: params.id },
    data: {
      ...(body.status ? { status: body.status as BookingStatus } : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    },
    include: { pitch: true },
  });

  return NextResponse.json({ booking });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await db.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  await db.booking.update({
    where: { id: params.id },
    data: { deletedAt: existing.deletedAt ?? new Date() },
  });
  return NextResponse.json({ ok: true });
}
