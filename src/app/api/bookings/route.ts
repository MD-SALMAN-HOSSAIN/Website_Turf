import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  generateSlotRanges,
  getPitchSlotConfig,
  isContiguous,
  isFootballSport,
  overlaps,
  rangeMinutes,
  selectRangeBounds,
  toWindowMinutes,
} from "@/lib/slot-calculator";
import { normalizeNid, normalizePhone, validateNid, validatePhone } from "@/lib/nid-validator";
import type { Booking, PaymentMethod } from "@/types/booking";
import type { Booking as BookingModel, Pitch } from "@prisma/client";

export const dynamic = "force-dynamic";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAYMENT_METHODS = ["CASH", "BKASH", "NAGAD", "ROCKET", "CARD"] as const;
const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

function serialize(
  booking: BookingModel & { pitch?: Pitch | null }
): Booking {
  return {
    id: booking.id,
    code: booking.code,
    pitchId: booking.pitchId,
    pitchName: booking.pitch?.name,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    name: booking.name,
    phone: booking.phone,
    nid: booking.nid,
    teamName: booking.teamName,
    paymentMethod: booking.paymentMethod,
    status: booking.status,
    amount: booking.amount,
    notes: booking.notes,
    manual: booking.manual,
    createdAt: booking.createdAt.toISOString(),
  };
}

function generateCode() {
  let code = "BK-";
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const admin = await getAdminSession();

  const code = searchParams.get("code");
  const phone = searchParams.get("phone");
  const nid = searchParams.get("nid");

  if (code || phone || nid) {
    const where: Record<string, unknown> = {};
    if (code) where.code = code.trim().toUpperCase();
    if (phone) where.phone = normalizePhone(phone);
    if (nid) where.nid = normalizeNid(nid);

    const bookings = await db.booking.findMany({
      where,
      include: { pitch: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const payload = bookings.map((booking) => {
      const base = serialize(booking);
      if (admin) return base;
      return { ...base, nid: base.nid.replace(/\d(?=\d{4})/g, "*"), phone: base.phone.replace(/\d(?=\d{3})/g, "*") };
    });

    return NextResponse.json({ bookings: payload, lookup: true });
  }

  if (!admin) {
    return NextResponse.json(
      { error: "Search by phone, NID, or booking code." },
      { status: 401 }
    );
  }

  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (status && (STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }
  if (date) where.date = date;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { code: { contains: q, mode: "insensitive" } },
      { teamName: { contains: q, mode: "insensitive" } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    include: { pitch: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({ bookings: bookings.map(serialize) });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const admin = await getAdminSession();
  const isManual = body.manual === true;
  if (isManual && !admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const pitchKey = typeof body.pitchId === "string" ? body.pitchId.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const rawNid = typeof body.nid === "string" ? body.nid.trim() : "";
  const teamName = typeof body.teamName === "string" ? body.teamName.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.toUpperCase() : "";

  const errors: Record<string, string> = {};

  if (!pitchKey) errors.pitchId = "Select a pitch.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = "Invalid date.";
  } else if (date < new Date().toISOString().slice(0, 10)) {
    errors.date = "Date cannot be in the past.";
  }
  if (name.length < 2) errors.name = "Enter your full name.";

  const phoneCheck = validatePhone(rawPhone);
  if (!phoneCheck.valid) errors.phone = phoneCheck.message ?? "Invalid phone.";
  const nidCheck = validateNid(rawNid);
  if (!nidCheck.valid) errors.nid = nidCheck.message ?? "Invalid NID.";
  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    errors.paymentMethod = "Choose a payment method.";
  }

  const pitch = await db.pitch.findFirst({
    where: { active: true, OR: [{ id: pitchKey }, { slug: pitchKey }] },
  });
  if (!pitch) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        details: { ...errors, pitchId: "Pitch not found." },
      },
      { status: 422 }
    );
  }

  let slots: { startTime: string; endTime: string }[] = [];
  if (Array.isArray(body.slots) && body.slots.length > 0) {
    slots = body.slots
      .filter(
        (slot): slot is { startTime: string; endTime: string } =>
          typeof slot === "object" &&
          slot !== null &&
          typeof (slot as { startTime?: unknown }).startTime === "string" &&
          typeof (slot as { endTime?: unknown }).endTime === "string"
      )
      .map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime }));
    if (slots.length === 0) {
      errors.slots = "Selected slots must be consecutive.";
    } else if (isFootballSport(pitch.sport)) {
      if (slots.length > 1) {
        errors.slots = "Book football matches one slot at a time.";
      }
    } else if (!isContiguous(slots)) {
      errors.slots = "Selected slots must be consecutive.";
    }
  } else if (
    typeof body.startTime === "string" &&
    typeof body.endTime === "string"
  ) {
    slots = [{ startTime: body.startTime, endTime: body.endTime }];
  } else {
    errors.slots = "Select at least one slot.";
  }

  const siteConfig = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  const slotConfig = getPitchSlotConfig(
    pitch,
    siteConfig?.openingTime ?? DEFAULT_OPENING,
    siteConfig?.closingTime ?? DEFAULT_CLOSING
  );

  const bounds = slots.length > 0 ? selectRangeBounds(slots, slotConfig.opening) : null;

  if (bounds && !errors.slots) {
    const start = toWindowMinutes(bounds.startTime, slotConfig.opening);
    const end = toWindowMinutes(bounds.endTime, slotConfig.opening);
    if (end <= start) {
      errors.slots = "End time must be after start time.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", details: errors },
      { status: 422 }
    );
  }

  if (!bounds) {
    return NextResponse.json(
      { error: "Select at least one slot.", details: { slots: "Pick a valid slot." } },
      { status: 422 }
    );
  }

  const validRanges = generateSlotRanges(
    slotConfig.opening,
    slotConfig.closing,
    slotConfig.slotMinutes,
    slotConfig.gapMinutes
  );
  const validStarts = new Set(validRanges.map((range) => range.startTime));
  const validEnds = new Set(validRanges.map((range) => range.endTime).concat(slotConfig.closing));

  if (isFootballSport(pitch.sport)) {
    const exactlyOneSlot = validRanges.some(
      (range) => range.startTime === bounds.startTime && range.endTime === bounds.endTime
    );
    if (!exactlyOneSlot) {
      return NextResponse.json(
        { error: "Selected time is outside operating hours.", details: { slots: "Pick a valid slot." } },
        { status: 422 }
      );
    }
  } else if (!validStarts.has(bounds.startTime) || !validEnds.has(bounds.endTime)) {
    return NextResponse.json(
      { error: "Selected time is outside operating hours.", details: { slots: "Pick a valid slot." } },
      { status: 422 }
    );
  }

  const existingBookings = await db.booking.findMany({
    where: {
      pitchId: pitch.id,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const clash = existingBookings.find((booking) =>
    overlaps(
      bounds.startTime,
      bounds.endTime,
      booking.startTime,
      booking.endTime,
      slotConfig.opening
    )
  );
  if (clash) {
    return NextResponse.json(
      {
        error: `That time is already booked (${clash.startTime}–${clash.endTime}). Pick another slot.`,
      },
      { status: 409 }
    );
  }

  const overrides = await db.slotOverride.findMany({
    where: { pitchId: pitch.id, date, isBlocked: true },
  });
  const blocked = overrides.find((override) =>
    overlaps(
      bounds.startTime,
      bounds.endTime,
      override.startTime,
      override.endTime,
      slotConfig.opening
    )
  );
  if (blocked) {
    return NextResponse.json(
      { error: `This slot is blocked for ${blocked.reason ?? "maintenance"}.` },
      { status: 409 }
    );
  }

  const hours = rangeMinutes(bounds.startTime, bounds.endTime, slotConfig.opening) / 60;
  const rateOverrides = await db.slotOverride.findMany({
    where: { pitchId: pitch.id, date, rateOverride: { not: null } },
  });
  const customRate = rateOverrides.find((override) =>
    overlaps(
      bounds.startTime,
      bounds.endTime,
      override.startTime,
      override.endTime,
      slotConfig.opening
    )
  );
  const amount = Math.round((customRate?.rateOverride ?? pitch.ratePerHour) * hours);

  let booking: BookingModel | null = null;
  for (let attempt = 0; attempt < 6 && !booking; attempt++) {
    try {
      booking = await db.booking.create({
        data: {
          code: generateCode(),
          pitchId: pitch.id,
          date,
          startTime: bounds.startTime,
          endTime: bounds.endTime,
          name,
          phone: normalizePhone(rawPhone),
          nid: normalizeNid(rawNid),
          teamName: teamName || null,
          paymentMethod: paymentMethod as PaymentMethod,
          status: isManual ? "CONFIRMED" : "PENDING",
          amount,
          notes: notes || null,
          manual: isManual,
        },
        include: { pitch: true },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "P2002") throw error;
    }
  }

  if (!booking) {
    return NextResponse.json(
      { error: "Could not allocate a booking code. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ booking: serialize(booking) }, { status: 201 });
}
