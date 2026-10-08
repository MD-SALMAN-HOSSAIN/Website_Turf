"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { formatBdt, formatDateLong, formatHourRange, maskNid, maskPhone } from "@/lib/utils";
import { normalizeNid, normalizePhone } from "@/lib/nid-validator";
import type { Booking } from "@/types/booking";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-neon/10 text-neon ring-neon/40",
  PENDING: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  CANCELLED: "bg-red-500/10 text-red-300 ring-red-500/30",
  COMPLETED: "bg-white/10 text-white/70 ring-white/20",
};

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
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="surface-card flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-base font-bold text-neon">
                    {booking.code}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 " +
                      (STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING)
                    }
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">
                  {booking.pitchName ?? "Pitch"} · {formatHourRange(booking.startTime, booking.endTime)}
                </p>
                <p className="text-xs text-white/50">
                  {formatDateLong(booking.date)} · {booking.name} ·{" "}
                  {booking.teamName ?? "No team"}
                </p>
                <p className="text-xs text-white/40">
                  NID {maskNid(booking.nid)} · Phone {maskPhone(booking.phone)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold text-neon">
                  {formatBdt(booking.amount)}
                </p>
                <p className="text-xs text-white/50">{booking.paymentMethod}</p>
                <Link
                  href={`/booking/success?code=${booking.code}`}
                  className="mt-1 inline-block text-xs font-medium text-neon hover:underline"
                >
                  View voucher →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}