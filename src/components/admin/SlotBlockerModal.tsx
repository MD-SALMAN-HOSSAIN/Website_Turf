"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { buildTimeOptions, DEFAULT_CLOSING, DEFAULT_OPENING, getPitchSlotConfig } from "@/lib/slot-calculator";
import type { Pitch, SlotOverride } from "@/types/booking";

interface SlotBlockerModalProps {
  open: boolean;
  onClose: () => void;
  pitches: Pitch[];
  initial?: SlotOverride | null;
  onSaved: (message: string) => void;
  onDeleted?: (id: string) => void;
}

export default function SlotBlockerModal({
  open,
  onClose,
  pitches,
  initial,
  onSaved,
  onDeleted,
}: SlotBlockerModalProps) {
  const [pitchId, setPitchId] = useState(initial?.pitchId ?? pitches[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(initial?.startTime ?? DEFAULT_OPENING);
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [blocked, setBlocked] = useState(initial?.isBlocked ?? true);
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [rateOverride, setRateOverride] = useState<string>(
    initial?.rateOverride != null ? String(initial.rateOverride) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPitch = pitches.find((pitch) => pitch.id === pitchId) ?? pitches[0];
  const slotConfig = getPitchSlotConfig(
    selectedPitch ?? { sport: "" },
    DEFAULT_OPENING,
    DEFAULT_CLOSING
  );
  const timeOptions = buildTimeOptions(slotConfig);

  useEffect(() => {
    if (initial || !open) return;
    setStartTime(slotConfig.opening);
    setEndTime(timeOptions[1] ?? slotConfig.closing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pitchId, initial?.id]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/block-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitchId,
          date,
          startTime,
          endTime,
          blocked,
          reason: blocked ? reason : undefined,
          rateOverride: rateOverride ? Number(rateOverride) : null,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError((json as { error?: string }).error ?? "Could not save slot rule.");
        return;
      }
      onSaved(blocked ? "Slot blocked." : "Rate updated.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/block-slot?id=${encodeURIComponent(initial.id)}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok) {
        setError((json as { error?: string }).error ?? "Could not remove rule.");
        return;
      }
      onDeleted?.(initial.id);
      onSaved("Slot rule removed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/10 bg-surface p-6 shadow-card sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-bold">
            {initial ? "Edit slot rule" : "Manage slot"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 ring-1 ring-white/15 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
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
                  {pitch.name}
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={blocked}
                onChange={(event) => setBlocked(event.target.checked)}
                className="h-4 w-4 accent-neon"
              />
              Block this time
            </label>
          </div>

          {blocked && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                Reason (e.g. weather, maintenance)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Maintenance"
                className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Override rate (BDT/hr)
            </label>
            <input
              type="number"
              min={0}
              value={rateOverride}
              onChange={(event) => setRateOverride(event.target.value)}
              placeholder="Leave empty to keep pitch rate"
              className="w-full rounded-xl bg-surface-raised px-4 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-neon/60"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {initial && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                Remove
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-neon py-2.5 font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : initial ? "Save changes" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}