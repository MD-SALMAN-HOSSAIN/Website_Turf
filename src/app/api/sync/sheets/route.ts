import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { appendBookings, isSheetsConfigured, toCsv } from "@/lib/google-sheets";

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

  const [total, synced] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);

  return NextResponse.json({
    configured: isSheetsConfigured(),
    sheetId: process.env.GOOGLE_SHEETS_ID ?? null,
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
    totalBookings: total,
    bookingsLast24h: synced,
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { mode?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const mode = body.mode ?? "incremental";

  const since =
    mode === "batch" ? new Date(0) : new Date(Date.now() - 86_400_000);

  const bookings = await db.booking.findMany({
    where: { createdAt: { gte: since } },
    include: { pitch: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = bookings.map((booking) => ({
    ...booking,
    pitchName: booking.pitch?.name,
    createdAt: booking.createdAt,
  }));

  if (mode === "export") {
    return NextResponse.json({ csv: toCsv(rows), count: rows.length });
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Sheets is not configured. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await appendBookings(rows);
    return NextResponse.json({
      ok: true,
      appended: result.appended,
      mode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed." },
      { status: 502 }
    );
  }
}
