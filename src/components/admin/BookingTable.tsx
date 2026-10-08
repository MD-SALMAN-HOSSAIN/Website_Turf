"use client";

import { formatBdt, formatDateShort, formatHourRange, maskNid, maskPhone } from "@/lib/utils";
import type { Booking } from "@/types/booking";

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-neon/10 text-neon ring-neon/40",
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  CANCELLED: "bg-red-500/10 text-red-300 ring-red-500/30",
  COMPLETED: "bg-white/10 text-white/70 ring-white/20",
};

interface BookingTableProps {
  bookings: Booking[];
  loading: boolean;
  onChangeStatus: (id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") => void;
  onDelete: (id: string) => void;
  workingId: string | null;
}

export default function BookingTable({
  bookings,
  loading,
  onChangeStatus,
  onDelete,
  workingId,
}: BookingTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl bg-surface-raised" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <p className="text-3xl">🗓️</p>
        <p className="mt-2 text-sm text-white/60">No bookings match these filters.</p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Booking</th>
            <th className="px-4 py-3">Slot</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const busy = workingId === booking.id;
            return (
              <tr key={booking.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold text-neon">{booking.code}</span>
                  <span className="block text-[11px] text-white/40">
                    {booking.manual ? "Manual" : "Online"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{booking.pitchName ?? "Pitch"}</p>
                  <p className="text-[11px] text-white/40">{formatDateShort(booking.date)}</p>
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatHourRange(booking.startTime, booking.endTime)}
                </td>
                <td className="px-4 py-3">
                  <p>{booking.name}</p>
                  <p className="text-[11px] text-white/40">
                    {maskPhone(booking.phone)} · {maskNid(booking.nid)}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {booking.teamName ?? "No team"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{booking.paymentMethod}</p>
                  <p className="font-semibold text-neon">{formatBdt(booking.amount)}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 " +
                      (STATUS_BADGE[booking.status] ?? STATUS_BADGE.PENDING)
                    }
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {booking.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onChangeStatus(booking.id, "CONFIRMED")}
                        className="rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-charcoal transition hover:bg-neon-soft disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onChangeStatus(booking.id, "COMPLETED")}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    {booking.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onChangeStatus(booking.id, "CANCELLED")}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(booking.id)}
                      title="Delete"
                      className="rounded-lg px-2 py-1.5 text-xs text-white/40 transition hover:text-red-300 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}