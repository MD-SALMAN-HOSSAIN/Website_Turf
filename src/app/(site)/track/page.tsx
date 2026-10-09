"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  CANCELLATION_WINDOW_HOURS,
  formatBdt,
  formatDateLong,
  formatHourRange,
  hoursUntilSlot,
  maskNid,
  maskPhone,
} from "@/lib/utils";
import { normalizeNid, normalizePhone } from "@/lib/nid-validator";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import type { Booking } from "@/types/booking";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-neon/10 text-neon ring-neon/40",
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  CANCELLED: "bg-red-500/10 text-red-300 ring-red-500/30",
  COMPLETED: "bg-white/10 text-white/70 ring-white/20",
};

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-sm leading-none" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          {label}
        </p>
        <p className="max-w-[15rem] truncate text-sm font-medium text-white/80" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setError("Enter your phone number or NID.");
      setBookings(null);
      setSearched(false);
      return;
    }

    setSearching(true);
    setError(null);
    setBookings(null);

    const digits = value.replace(/\D/g, "");
    const param =
      digits.startsWith("01") && digits.length === 11
        ? `phone=${encodeURIComponent(normalizePhone(value))}`
        : `nid=${encodeURIComponent(normalizeNid(value))}`;

    try {
      const response = await fetch(`/api/bookings?${param}`);
      const json = await response.json();
      if (!response.ok) {
        setError((json as { error?: string }).error ?? "Search failed.");
        setSearched(true);
        return;
      }
      const found = (json as { bookings: Booking[] }).bookings;
      setBookings(found);
      setSearched(true);
      if (found.length === 0) {
        setError("No bookings found. Check the number and try again.");
      }
    } catch {
      setError("Network error. Please try again.");
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <span className="inline-block rounded-full bg-neon/10 px-3 py-1 text-xs font-semibold text-neon ring-1 ring-neon/30">
          Booking lookup
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">Find my booking</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Enter the phone number or NID you booked with to view your slots instantly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="surface-card mx-auto mt-8 flex max-w-md flex-col gap-3 p-4 sm:flex-row"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="01XXXXXXXXX or NID number"
          className="w-full flex-1 rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-neon px-6 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-6 text-center text-sm text-red-300">{error}</p>
      )}

      {bookings && bookings.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {bookings.length} booking{bookings.length > 1 ? "s" : ""} found
          </h2>
          {bookings.map((booking) => {
            const eligible =
              booking.status === "PENDING" || booking.status === "CONFIRMED"
                ? hoursUntilSlot(booking.date, booking.startTime) >= CANCELLATION_WINDOW_HOURS
                : false;
            const bookedFor = booking.teamName
              ? `${booking.name} • ${booking.teamName}`
              : booking.name;
            return (
              <div
                key={booking.id}
                className="group rounded-2xl border border-white/10 bg-[#121316] transition hover:border-[#c4f03a]/40"
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                  <span className="font-display text-xl font-extrabold tracking-wide text-[#c4f03a]">
                    {booking.code}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 " +
                      (STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING)
                    }
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div className="min-w-0 space-y-4">
                    <p className="font-display text-lg font-semibold leading-tight">
                      {booking.pitchName ?? "Pitch"}
                    </p>
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      <Meta icon="📅" label="Date" value={formatDateLong(booking.date)} />
                      <Meta
                        icon="⏰"
                        label="Time"
                        value={formatHourRange(booking.startTime, booking.endTime)}
                      />
                      <Meta icon="👤" label="Booked by" value={bookedFor} />
                      <Meta
                        icon="📞"
                        label="Contact"
                        value={`${maskPhone(booking.phone)} • NID ${maskNid(booking.nid)}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-center gap-2 border-t border-white/10 pt-5 sm:w-44 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                      Total amount
                    </p>
                    <p className="font-display text-2xl font-extrabold text-[#c4f03a]">
                      {formatBdt(booking.amount)}
                    </p>
                    <span className="rounded-full bg-[#c4f03a]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c4f03a] ring-1 ring-[#c4f03a]/40">
                      {booking.paymentMethod}
                    </span>
                    <Link
                      href={`/booking/success?code=${booking.code}`}
                      className="mt-1 rounded-xl bg-[#c4f03a] px-4 py-2 text-xs font-bold text-[#121316] shadow-[0_0_14px_rgba(196,240,58,0.22)] transition hover:brightness-110"
                    >
                      View Voucher →
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs">
                  <p className="flex min-w-0 items-center gap-2 text-white/40">
                    <span aria-hidden="true">⚠️</span>
                    <span>
                      {eligible
                        ? `Free cancellation up to ${CANCELLATION_WINDOW_HOURS}h before your slot.`
                        : `Cancellation closed — must cancel ${CANCELLATION_WINDOW_HOURS}h before slot.`}
                    </span>
                  </p>
                  {eligible && (
                    <CancelBookingButton
                      booking={booking}
                      onCancelled={(updated) =>
                        setBookings((prev) =>
                          prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev
                        )
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}