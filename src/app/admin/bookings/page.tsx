"use client";

import { useCallback, useEffect, useState } from "react";
import BookingTable from "@/components/admin/BookingTable";
import ManualBookingModal from "@/components/admin/ManualBookingModal";
import { addDaysIso, formatDateShort, todayIso } from "@/lib/utils";
import type { Booking, Pitch } from "@/types/booking";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState(todayIso());
  const [q, setQ] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);

  useEffect(() => {
    fetch("/api/slots/availability")
      .then(async (response) => {
        if (!response.ok) return;
        const json = await response.json();
        setPitches((json as { pitches: Pitch[] }).pitches);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (date) params.set("date", date);
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/bookings?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setBookings(json.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [status, date, q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function changeStatus(id: string, next: "CONFIRMED" | "CANCELLED" | "COMPLETED") {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setToast(`Booking ${json.booking.code} → ${next}.`);
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setWorkingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function deleteBooking(id: string) {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setToast("Booking deleted.");
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setWorkingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  const quickDates = [todayIso(), addDaysIso(todayIso(), 1), addDaysIso(todayIso(), 2)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Bookings</h1>
          <p className="mt-1 text-sm text-white/50">Confirm, cancel, and manage reservations.</p>
        </div>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="rounded-xl bg-neon px-4 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft"
        >
          + Manual booking
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-surface-raised p-1 ring-1 ring-white/10">
          {["", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={
                status === option
                  ? "rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-charcoal"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white"
              }
            >
              {option === "" ? "All" : option}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl bg-surface-raised p-1 ring-1 ring-white/10">
          {quickDates.map((quickDate) => (
            <button
              key={quickDate}
              type="button"
              onClick={() => setDate(quickDate)}
              className={
                date === quickDate
                  ? "rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-charcoal"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white"
              }
            >
              {quickDate === todayIso() ? "Today" : formatDateShort(quickDate)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDate("")}
            className={
              date === ""
                ? "rounded-lg bg-neon px-3 py-1.5 text-xs font-semibold text-charcoal"
                : "rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white"
            }
          >
            All dates
          </button>
        </div>

        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, phone, code, team…"
          className="min-w-52 flex-1 rounded-xl bg-surface-raised px-4 py-2 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
        />
      </div>

      {toast && (
        <div className="rounded-xl bg-neon/10 px-4 py-2 text-sm font-medium text-neon ring-1 ring-neon/40">
          {toast}
        </div>
      )}

      <BookingTable
        bookings={bookings}
        loading={loading}
        onChangeStatus={changeStatus}
        onDelete={deleteBooking}
        workingId={workingId}
      />

      <ManualBookingModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        pitches={pitches}
        onSuccess={(message) => {
          setToast(message);
          setManualOpen(false);
          load();
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </div>
  );
}