"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { formatBdt, formatHourRange } from "@/lib/utils";
import { validateNid, validatePhone } from "@/lib/nid-validator";
import type { PaymentMethod, Pitch, TimeSlot } from "@/types/booking";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  pitch: Pitch | null;
  date: string;
  slots: TimeSlot[];
  total: number;
  onSuccess: (code: string) => void;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "BKASH", label: "bKash", icon: "📱" },
  { value: "NAGAD", label: "Nagad", icon: "📲" },
  { value: "ROCKET", label: "Rocket", icon: "🚀" },
  { value: "CASH", label: "Pay at venue", icon: "💵" },
  { value: "CARD", label: "Card", icon: "💳" },
];

export default function BookingModal({
  open,
  onClose,
  pitch,
  date,
  slots,
  total,
  onSuccess,
}: BookingModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [teamName, setTeamName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BKASH");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const bounds =
    slots.length > 0
      ? {
          startTime: slots[0].startTime,
          endTime: slots[slots.length - 1].endTime,
        }
      : { startTime: "", endTime: "" };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Enter your full name.";
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
          pitchId: pitch?.id,
          date,
          startTime: bounds.startTime,
          endTime: bounds.endTime,
          name: name.trim(),
          phone,
          nid,
          teamName: teamName.trim() || null,
          paymentMethod,
          notes: notes.trim() || null,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.details) setErrors(json.details);
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSuccess(json.booking.code);
    } catch {
      setServerError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-surface p-6 shadow-card sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Confirm your booking</h2>
            <p className="mt-1 text-sm text-white/60">
              {pitch?.name} · {date}
            </p>
            <p className="text-sm text-white/60">
              {formatHourRange(bounds.startTime, bounds.endTime)} ·{" "}
              <span className="font-semibold text-neon">{formatBdt(total)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/60 ring-1 ring-white/15 transition hover:text-white"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Full name <span className="text-neon">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Rahim Uddin"
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Phone number <span className="text-neon">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              NID number <span className="text-neon">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={nid}
              onChange={(event) => setNid(event.target.value)}
              placeholder="10-digit Smart or 17-digit Classic NID"
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
            {errors.nid && <p className="mt-1 text-xs text-red-400">{errors.nid}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Team name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="e.g. Dhanmondi United"
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Payment method <span className="text-neon">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={
                    paymentMethod === option.value
                      ? "rounded-xl bg-neon px-3 py-2 text-left text-xs font-semibold text-charcoal ring-neon shadow-glow-sm"
                      : "rounded-xl bg-surface-raised px-3 py-2 text-left text-xs text-white/70 ring-1 ring-white/10 transition hover:ring-neon/40"
                  }
                >
                  <span className="mr-1">{option.icon}</span> {option.label}
                </button>
              ))}
            </div>
          </div>

          {serverError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-surface-raised px-4 py-3 ring-1 ring-white/10">
            <span className="text-sm text-white/70">Total to pay</span>
            <span className="font-display text-lg font-bold text-neon">{formatBdt(total)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-neon py-3 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
          <p className="text-center text-[11px] text-white/40">
            Booking reference will be generated instantly. You can track it anytime.
          </p>
        </form>
      </div>
    </div>
  );
}