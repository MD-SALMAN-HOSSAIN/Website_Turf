"use client";

import { cn, formatBdt } from "@/lib/utils";
import type { TimeSlot } from "@/types/booking";

interface SlotCardProps {
  slot: TimeSlot;
  selected: boolean;
  onToggle: (slot: TimeSlot) => void;
}

export default function SlotCard({ slot, selected, onToggle }: SlotCardProps) {
  const disabled = slot.state !== "available";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(slot)}
      title={slot.reason ?? undefined}
      className={cn(
        "relative w-full rounded-xl px-3 py-3 text-left ring-1 transition-all duration-150",
        slot.state === "available" &&
          !selected &&
          "bg-surface-raised ring-white/10 hover:ring-neon/60 hover:shadow-glow-sm",
        selected && "bg-neon text-charcoal ring-neon shadow-glow-sm",
        slot.state === "booked" &&
          "cursor-not-allowed bg-surface opacity-50 ring-white/5 line-through",
        slot.state === "blocked" &&
          "cursor-not-allowed bg-red-950/30 opacity-70 ring-red-500/20",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">
          {slot.startTime} – {slot.endTime}
        </span>
        {slot.state === "available" && (
          <span className={cn("text-xs font-bold", selected ? "text-charcoal" : "text-neon")}>
            {formatBdt(slot.price)}
          </span>
        )}
        {slot.state === "blocked" && (
          <span className="text-[10px] font-semibold uppercase text-red-400">
            {slot.reason ?? "Blocked"}
          </span>
        )}
        {slot.state === "booked" && (
          <span className="text-[10px] font-semibold uppercase text-white/50">Booked</span>
        )}
      </div>
    </button>
  );
}