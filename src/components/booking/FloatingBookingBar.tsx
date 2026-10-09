"use client";

import { cn, formatBdt, formatDateShort, formatHourRange } from "@/lib/utils";
import { rangeMinutes, selectRangeBounds } from "@/lib/slot-calculator";
import type { TimeSlot } from "@/types/booking";

interface FloatingBookingBarProps {
  pitchName: string;
  date: string;
  opening?: string;
  slots: TimeSlot[];
  onClear: () => void;
  onBook: () => void;
}

export default function FloatingBookingBar({
  pitchName,
  date,
  opening = "00:00",
  slots,
  onClear,
  onBook,
}: FloatingBookingBarProps) {
  const bounds = selectRangeBounds(slots, opening);
  const total = slots.reduce((sum, slot) => sum + slot.price, 0);
  const hours = rangeMinutes(bounds.startTime, bounds.endTime, opening) / 60;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-6xl px-4 pb-4">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neon/30 bg-surface-raised/95 px-4 py-3 shadow-card backdrop-blur glow-ring"
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {pitchName} · {formatDateShort(date)}
            </p>
            <p className="text-xs text-white/60">
              {formatHourRange(bounds.startTime, bounds.endTime)} · {hours} hr{hours !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-display text-xl font-bold text-neon">
              {formatBdt(total)}
            </p>
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl px-3 py-2 text-sm font-medium text-white/60 ring-1 ring-white/15 transition hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onBook}
              className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-charcoal shadow-glow-sm transition hover:bg-neon-soft"
            >
              Book now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}