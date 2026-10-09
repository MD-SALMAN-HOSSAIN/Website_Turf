"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBdt, formatDateShort, formatHourRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";

const FILTERS = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "REMOVED", label: "Removed" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-neon/10 text-neon ring-neon/40",
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  CANCELLED: "bg-red-500/10 text-red-300 ring-red-500/30",
  COMPLETED: "bg-white/10 text-white/70 ring-white/20",
};

export default function BookingHistoryTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ includeDeleted: "1" });
      if (q.trim()) params.set("q", q.trim());
      if (status && status !== "REMOVED") params.set("status", status);
      const response = await fetch(`/api/bookings?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      let rows = json.bookings as Booking[];
      if (status === "REMOVED") rows = rows.filter((booking) => booking.deletedAt);
      setBookings(rows);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">All bookings</h2>
          <p className="text-xs text-white/40">
            Every reservation from the beginning — including cancelled and removed.
          </p>
        </div>
        <span className="text-xs text-white/40">
          {loading ? "Loading…" : `${bookings.length} record${bookings.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-raised p-1 ring-1 ring-white/10">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setStatus(option.key)}
              className={
                status === option.key
                  ? "rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-charcoal"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white"
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search code, name, phone, NID, team, court…"
          className="min-w-52 flex-1 rounded-xl bg-surface-raised px-4 py-2 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-surface-raised" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-3xl">🧾</p>
          <p className="mt-2 text-sm text-white/60">No bookings match these filters.</p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Court</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const removed = Boolean(booking.deletedAt);
                return (
                  <tr
                    key={booking.id}
                    className={
                      "border-b border-white/5 last:border-0" + (removed ? " opacity-55" : "")
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neon">{booking.code}</span>
                      <span className="block text-[11px] text-white/40">
                        {booking.manual ? "Manual" : "Online"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{booking.pitchName ?? "Court"}</td>
                    <td className="px-4 py-3 text-white/70">{formatDateShort(booking.date)}</td>
                    <td className="px-4 py-3 text-white/70">
                      {formatHourRange(booking.startTime, booking.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <p>{booking.name}</p>
                      <p className="text-[11px] text-white/40">
                        {booking.teamName ?? "No team"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-white/70">{booking.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 " +
                            (STATUS_BADGE[booking.status] ?? STATUS_BADGE.PENDING)
                          }
                        >
                          {booking.status}
                        </span>
                        {removed && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/60 ring-1 ring-white/20">
                            Removed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatBdt(booking.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
