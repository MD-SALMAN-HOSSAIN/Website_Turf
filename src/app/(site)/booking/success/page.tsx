"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatBdt, formatDateLong, formatHourRange, maskNid, maskPhone } from "@/lib/utils";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import type { Booking } from "@/types/booking";

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-neon/10 text-neon ring-neon/40",
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  CANCELLED: "bg-red-500/10 text-red-300 ring-red-500/30",
  COMPLETED: "bg-white/10 text-white/70 ring-white/20",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) {
      setError("No booking code provided.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/bookings?code=${encodeURIComponent(code)}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error((json as { error?: string }).error ?? "Booking not found.");
      }
      const found = (json as { bookings: Booking[] }).bookings[0];
      if (!found) throw new Error("Booking not found.");
      setBooking(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking not found.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="surface-card mx-auto max-w-lg p-10 text-center">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-surface-raised" />
        <p className="mt-4 text-sm text-white/50">Fetching your voucher…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="surface-card mx-auto max-w-lg p-10 text-center">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-3 font-display text-xl font-bold">Voucher not found</h1>
        <p className="mt-2 text-sm text-red-300">{error}</p>
        <Link
          href="/track"
          className="mt-5 inline-block rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal"
        >
          Find my booking
        </Link>
      </div>
    );
  }

  const badge = STATUS_BADGE[booking.status] ?? STATUS_BADGE.PENDING;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neon text-charcoal shadow-glow">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Booking confirmed!</h1>
        <p className="mt-1 text-sm text-white/60">
          Show this voucher at the reception — no printing required.
        </p>
      </div>

      <div className="print-card surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-dashed border-white/15 bg-surface-raised px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Booking reference
          </span>
          <span className="font-display text-xl font-extrabold tracking-wide text-neon">
            {booking.code}
          </span>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Pitch</p>
            <p className="font-display text-lg font-semibold">
              {booking.pitchName ?? "Pitch"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Date</p>
              <p className="text-sm font-medium">{formatDateLong(booking.date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Time</p>
              <p className="text-sm font-medium">{formatHourRange(booking.startTime, booking.endTime)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Booked for</p>
              <p className="text-sm font-medium">{booking.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Phone</p>
              <p className="text-sm font-medium">{maskPhone(booking.phone)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">NID</p>
              <p className="text-sm font-medium">{maskNid(booking.nid)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Team</p>
              <p className="text-sm font-medium">{booking.teamName ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-4">
            <span className="text-sm text-white/60">
              {booking.paymentMethod} · {booking.status}
            </span>
            <span className="font-display text-xl font-bold text-neon">
              {formatBdt(booking.amount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-surface-raised px-5 py-3 text-xs text-white/50">
          <span className={badge}>
            {booking.status === "CONFIRMED" ? "Confirmed" : booking.status.toLowerCase()}
          </span>
          <span>{booking.paymentMethod === "CASH" ? "Pay at venue" : `Pay via ${booking.paymentMethod}`}</span>
        </div>
      </div>

      <div className="no-print mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft"
        >
          Print voucher
        </button>
        <Link
          href="/track"
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
        >
          Back to home
        </Link>
      </div>

      <div className="no-print mt-4 flex justify-center">
        <CancelBookingButton booking={booking} onCancelled={(updated) => setBooking(updated)} />
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-white/50">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}