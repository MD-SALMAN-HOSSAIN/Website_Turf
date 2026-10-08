import Link from "next/link";
import { db } from "@/lib/db";
import {
  DEFAULT_CLOSING,
  DEFAULT_OPENING,
  generateSlotRanges,
} from "@/lib/slot-calculator";
import { formatBdt, formatHourRange, todayIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const today = todayIso();
  const monthPrefix = today.slice(0, 7);

  const [
    confirmedToday,
    pendingCount,
    cancelledToday,
    monthRows,
    monthConfirmed,
    pitches,
    todaySchedule,
    config,
  ] = await Promise.all([
    db.booking.findMany({
      where: { date: today, status: "CONFIRMED" },
      include: { pitch: true },
      orderBy: { startTime: "asc" },
    }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { date: today, status: "CANCELLED" } }),
    db.booking.findMany({
      where: { date: { startsWith: monthPrefix } },
      select: { amount: true, status: true, date: true },
    }),
    db.booking.findMany({
      where: { date: { startsWith: monthPrefix }, status: "CONFIRMED" },
      select: { amount: true },
    }),
    db.pitch.count({ where: { active: true } }),
    db.booking.findMany({
      where: { date: today },
      include: { pitch: true },
      orderBy: { startTime: "asc" },
      take: 20,
    }),
    db.siteConfig.findUnique({ where: { id: "singleton" } }),
  ]);

  const revenueToday = confirmedToday.reduce((sum, booking) => sum + booking.amount, 0);
  const revenueMonth = monthConfirmed.reduce((sum, booking) => sum + booking.amount, 0);
  const allSlotsCount = monthRows.length;

  const opening = config?.openingTime ?? DEFAULT_OPENING;
  const closing = config?.closingTime ?? DEFAULT_CLOSING;
  const slotsToday = generateSlotRanges(opening, closing).length;

  const pitchesBookedToday = new Set(todaySchedule.map((booking) => booking.pitchId)).size;

  const kpis = [
    { label: "Bookings today", value: String(confirmedToday.length), hint: "Confirmed" },
    { label: "Revenue today", value: formatBdt(revenueToday), hint: "Confirmed only" },
    { label: "Pending approvals", value: String(pendingCount), hint: "Awaiting confirm" },
    { label: "This month", value: `${allSlotsCount} · ${formatBdt(revenueMonth)}`, hint: "Bookings · revenue" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          {today} — here&apos;s what&apos;s happening across {pitches} active pitches.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {kpi.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-neon">{kpi.value}</p>
            <p className="mt-1 text-xs text-white/40">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Pitches booked today
          </p>
          <p className="mt-2 font-display text-2xl font-bold">
            {pitchesBookedToday} / {pitches}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Slot capacity / day
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{slotsToday} per pitch</p>
          <p className="mt-1 text-xs text-white/40">{opening} – {closing} operating hours</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Cancelled today
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{cancelledToday}</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Today&apos;s schedule</h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-neon hover:underline"
          >
            All bookings →
          </Link>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-white/50">
            No bookings today yet.
          </div>
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Pitch</th>
                  <th className="px-4 py-3">Booked by</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {todaySchedule.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {formatHourRange(booking.startTime, booking.endTime)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neon">{booking.code}</td>
                    <td className="px-4 py-3">{booking.pitch?.name}</td>
                    <td className="px-4 py-3">{booking.name}</td>
                    <td className="px-4 py-3 text-white/60">{booking.teamName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          booking.status === "CONFIRMED"
                            ? "rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-bold uppercase text-neon ring-1 ring-neon/40"
                            : booking.status === "PENDING"
                              ? "rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 ring-1 ring-amber-400/30"
                              : "rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300 ring-1 ring-red-500/30"
                        }
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatBdt(booking.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}