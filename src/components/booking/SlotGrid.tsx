"use client";

import SlotCard from "./SlotCard";
import type { PeriodGroup, TimeSlot } from "@/types/booking";

interface SlotGridProps {
  periods: PeriodGroup[];
  selected: TimeSlot[];
  onToggle: (slot: TimeSlot) => void;
  loading: boolean;
  error: string | null;
}

export default function SlotGrid({
  periods,
  selected,
  onToggle,
  loading,
  error,
}: SlotGridProps) {
  const selectedIds = new Set(selected.map((slot) => slot.id));

  if (loading) {
    return (
      <div className="space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-surface-raised" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-14 animate-pulse rounded-xl bg-surface-raised" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card border border-red-500/20 p-8 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-sm text-red-300">{error}</p>
        <p className="mt-1 text-xs text-white/50">Refresh the page to try again.</p>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-sm text-white/60">No slots available for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {periods.map((group) => {
        const available = group.slots.filter((slot) => slot.state === "available").length;
        return (
          <section key={group.key}>
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {group.label}
                  <span className="ml-2 text-xs font-normal text-white/40">
                    {group.hint}
                  </span>
                </h3>
              </div>
              <span className="text-xs font-medium text-white/50">
                {available} of {group.slots.length} open
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {group.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  selected={selectedIds.has(slot.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}