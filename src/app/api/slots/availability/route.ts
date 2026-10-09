import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  buildPeriodGroups,
  generateSlotRanges,
  getPeriod,
  getPitchSlotConfig,
  overlaps,
  type SlotConfig,
} from "@/lib/slot-calculator";
import { todayIso } from "@/lib/utils";
import type { AvailabilityResponse, Pitch, TimeSlot } from "@/types/booking";
import type { Booking, Pitch as PitchModel, SlotOverride } from "@prisma/client";

export const dynamic = "force-dynamic";

function serializePitch(pitch: PitchModel): Pitch {
  return {
    id: pitch.id,
    slug: pitch.slug,
    name: pitch.name,
    sport: pitch.sport,
    dimensions: pitch.dimensions,
    ratePerHour: pitch.ratePerHour,
    imageUrl: pitch.imageUrl,
    description: pitch.description,
    order: pitch.order,
    active: pitch.active,
  };
}

function buildSlots(
  pitch: PitchModel,
  date: string,
  config: SlotConfig,
  bookings: Booking[],
  overrides: SlotOverride[]
): TimeSlot[] {
  return generateSlotRanges(
    config.opening,
    config.closing,
    config.slotMinutes,
    config.gapMinutes
  ).map((range) => {
    const blockedOverride = overrides.find(
      (override) =>
        override.isBlocked &&
        overlaps(
          range.startTime,
          range.endTime,
          override.startTime,
          override.endTime,
          config.opening
        )
    );
    const rateOverride = overrides.find(
      (override) =>
        override.rateOverride != null &&
        overlaps(
          range.startTime,
          range.endTime,
          override.startTime,
          override.endTime,
          config.opening
        )
    );
    const booked = bookings.some((booking) =>
      overlaps(range.startTime, range.endTime, booking.startTime, booking.endTime, config.opening)
    );

    let state: TimeSlot["state"] = "available";
    if (blockedOverride) state = "blocked";
    else if (booked) state = "booked";

    return {
      id: `${pitch.slug}:${date}:${range.startTime}-${range.endTime}`,
      startTime: range.startTime,
      endTime: range.endTime,
      period: getPeriod(range.startTime),
      state,
      price: Math.round((rateOverride?.rateOverride ?? pitch.ratePerHour) * (config.slotMinutes / 60)),
      reason: blockedOverride?.reason ?? null,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    return await handleGet(request);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code) {
      return NextResponse.json(
        {
          error:
            "Database is not reachable. Configure DATABASE_URL, run `npm run db:push` then `npm run db:seed`.",
        },
        { status: 503 }
      );
    }
    throw error;
  }
}

async function handleGet(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get("date");
  const pitchParam = searchParams.get("pitch");

  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIso();

  const pitches = await db.pitch.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  if (pitches.length === 0) {
    return NextResponse.json(
      { error: "No pitches are configured yet. Run the database seed." },
      { status: 404 }
    );
  }

  const pitch =
    (pitchParam
      ? pitches.find((p) => p.slug === pitchParam || p.id === pitchParam)
      : null) ?? pitches[0];

  const siteConfig = await db.siteConfig.findUnique({ where: { id: "singleton" } });
  const slotConfig = getPitchSlotConfig(
    pitch,
    siteConfig?.openingTime ?? DEFAULT_OPENING,
    siteConfig?.closingTime ?? DEFAULT_CLOSING
  );

  const [bookings, overrides] = await Promise.all([
    db.booking.findMany({
      where: {
        pitchId: pitch.id,
        date,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    db.slotOverride.findMany({ where: { pitchId: pitch.id, date } }),
  ]);

  const slots = buildSlots(pitch, date, slotConfig, bookings, overrides);

  const payload: AvailabilityResponse = {
    date,
    opening: slotConfig.opening,
    closing: slotConfig.closing,
    pitch: serializePitch(pitch),
    pitches: pitches.map(serializePitch),
    slots,
    periods: buildPeriodGroups(slots),
  };

  return NextResponse.json(payload);
}
