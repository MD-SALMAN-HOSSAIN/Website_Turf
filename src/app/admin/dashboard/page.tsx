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
    totalBookings,
    activeCourts,
    confirmedToday,
    pendingCount,
    cancelledToday,
    monthRows,
    todaySchedule,
    config,
  ] = await Promise.all([
    db.booking.count(),
    db.pitch.count({ where: { active: true } }),
    db.booking.findMany({
      where: { date: today, status: "CONFIRMED" },
      include: { pitch: true },
      orderBy: { startTime: "asc" },
    }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { date: today, status: "CANCELLED" } }),
    db.booking.findMany({
      where: { date: { startsWith: monthPrefix } },
      select: { amount: true, status: true },
    }),
    db.booking.findMany({
      where: { date: today },
      include: { pitch: true },
      orderBy: { startTime: "asc" },
      take: 20,
    }),
    db.siteConfig.findUnique({ where: { id: "singleton" } }),
  ]);

  const revenueToday = confirmedToday.reduce((sum, booking) => sum + booking.amount, 0);
  const monthConfirmed = monthRows.filter((booking) => booking.status === "CONFIRMED");
  const revenueMonth = monthConfirmed.reduce((sum, booking) => sum + booking.amount, 0);
  const bookingsMonth = monthRows.length;

  const opening = config?.openingTime ?? DEFAULT_OPENING;
  const closing = config?.closingTime ?? DEFAULT_CLOSING;
  const slotsToday = generateSlotRanges(opening, closing).length;

  const courtsBookedToday = new Set(todaySchedule.map((booking) => booking.pitchId)).size;

  const kpis = [
    {
      label: "Total bookings",
      value: String(totalBookings),
      hint: "All time",
      icon: "🧾",
    },
    {
      label: "Active courts",
      value: String(activeCourts),
      hint: "Live on the website",
      icon: "🏟️",
    },
    {
      label: "Revenue today",
      value: formatBdt(revenueToday),
      hint: `${confirmedToday.length} confirmed`,
      icon: "💵",
    },
    {
      label: "Pending approvals",
      value: String(pendingCount),
      hint: "Awaiting confirmation",
      icon: "⏳",
    },
  ];

  const secondary = [
    { label: "Bookings this month", value: String(bookingsMonth), hint: formatBdt(revenueMonth) },
    { label: "Courts booked today", value: `${courtsBookedToday} / ${activeCourts}`, hint: "Unique courts" },
    { label: "Slot capacity / day", value: `${slotsToday}`, hint: `${opening} – ${closing}` },
    { label: "Cancelled today", value: String(cancelledToday), hint: "Across all courts" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            {today} — here&apos;s what&apos;s happening across {activeCourts} active courts.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
        >
          Manage bookings →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                {kpi.label}
              </p>
              <span className="text-base">{kpi.icon}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-neon">{kpi.value}</p>
            <p className="mt-1 text-xs text-white/40">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondary.map((item) => (
          <div key={item.label} className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {item.label}
            </p>
            <p className="mt-2 font-display text-xl font-bold">{item.value}</p>
            <p className="mt-1 text-xs text-white/40">{item.hint}</p>
          </div>
        ))}
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
                  <th className="px-4 py-3">Court</th>
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
