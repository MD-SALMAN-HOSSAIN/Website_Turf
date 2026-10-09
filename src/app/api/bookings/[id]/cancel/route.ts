import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { CANCELLATION_WINDOW_HOURS, hoursUntilSlot } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ error: "Booking code is required." }, { status: 422 });
  }

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: { pitch: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.code.toUpperCase() !== code) {
    return NextResponse.json({ error: "Booking code does not match." }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 409 });
  }
  if (booking.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Completed bookings cannot be cancelled." },
      { status: 409 }
    );
  }

  if (hoursUntilSlot(booking.date, booking.startTime) < CANCELLATION_WINDOW_HOURS) {
    return NextResponse.json(
      {
        error: `Cancellations must be made at least ${CANCELLATION_WINDOW_HOURS} hours before the slot. Please contact the venue.`,
      },
      { status: 422 }
    );
  }

  const updated = await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
    include: { pitch: true },
  });

  return NextResponse.json({ booking: updated });
}
