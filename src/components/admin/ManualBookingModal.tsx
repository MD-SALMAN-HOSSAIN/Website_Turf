"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { buildTimeOptions, DEFAULT_CLOSING, DEFAULT_OPENING } from "@/lib/slot-calculator";
import { validateNid, validatePhone } from "@/lib/nid-validator";
import type { PaymentMethod, Pitch } from "@/types/booking";

const PAYMENT_OPTIONS: PaymentMethod[] = ["CASH", "BKASH", "NAGAD", "ROCKET", "CARD"];

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  pitches: Pitch[];
  onSuccess: (message: string) => void;
}

export default function ManualBookingModal({
  open,
  onClose,
  pitches,
  onSuccess,
}: ManualBookingModalProps) {
  const [pitchId, setPitchId] = useState(pitches[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(DEFAULT_OPENING);
  const [endTime, setEndTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [teamName, setTeamName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const timeOptions = buildTimeOptions(DEFAULT_OPENING, DEFAULT_CLOSING);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Enter customer name.";
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) nextErrors.phone = phoneCheck.message ?? "Invalid phone.";
    const nidCheck = validateNid(nid);
    if (!nidCheck.valid) nextErrors.nid = nidCheck.message ?? "Invalid NID.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitchId,
          date,
          startTime,
          endTime,
          name: name.trim(),
          phone,
          nid,
          teamName: teamName.trim() || null,
          paymentMethod,
          manual: true,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.details) setErrors(json.details);
        setServerError(json.error ?? "Could not create booking.");
        return;
      }
      setPitchId(pitches[0]?.id ?? "");
      setStartTime(DEFAULT_OPENING);
      setEndTime("10:00");
      setName("");
      setPhone("");
      setNid("");
      setTeamName("");
      setPaymentMethod("CASH");
      onSuccess(`Booking ${json.booking.code} created.`);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-surface p-6 shadow-card sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold">Manual booking</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 ring-1 ring-white/15 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Pitch
              </label>
              <select
                value={pitchId}
                onChange={(event) => setPitchId(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              >
                {pitches.map((pitch) => (
                  <option key={pitch.id} value={pitch.id}>
                    {pitch.name} — ৳{pitch.ratePerHour}/hr
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Payment
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                From
              </label>
              <select
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              >
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                To
              </label>
              <select
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              >
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Customer name <span className="text-neon">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Phone <span className="text-neon">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                NID <span className="text-neon">*</span>
              </label>
              <input
                type="text"
                value={nid}
                onChange={(event) => setNid(event.target.value)}
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
              {errors.nid && <p className="mt-1 text-xs text-red-400">{errors.nid}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Team
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-neon py-3 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create booking (confirmed)"}
          </button>
        </form>
      </div>
    </div>
  );
}