"use client";

import { useState } from "react";
import { CANCELLATION_WINDOW_HOURS, hoursUntilSlot } from "@/lib/utils";
import type { Booking } from "@/types/booking";

interface CancelBookingButtonProps {
  booking: Booking;
  onCancelled?: (booking: Booking) => void;
}

export default function CancelBookingButton({ booking, onCancelled }: CancelBookingButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") return null;

  const eligible = hoursUntilSlot(booking.date, booking.startTime) >= CANCELLATION_WINDOW_HOURS;

  async function cancel() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: booking.code }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError((json as { error?: string }).error ?? "Could not cancel booking.");
        return;
      }
      setConfirming(false);
      onCancelled?.((json as { booking: Booking }).booking);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!eligible) {
    return (
      <p className="text-right text-xs text-white/40">
        Cancellation closed — must cancel {CANCELLATION_WINDOW_HOURS}h before the slot.
      </p>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/10"
      >
        Cancel booking
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-xs text-white/60">Cancel this booking?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={submitting}
          className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {submitting ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={submitting}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white disabled:opacity-60"
        >
          Keep
        </button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
