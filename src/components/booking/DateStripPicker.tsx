"use client";

import { cn, formatDateLong, relativeDayLabel } from "@/lib/utils";

interface DateStripPickerProps {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export default function DateStripPicker({
  dates,
  selectedDate,
  onSelect,
}: DateStripPickerProps) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Pick a day</h2>
        <span className="hidden text-sm text-white/50 sm:block">
          {formatDateLong(selectedDate)}
        </span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {dates.map((date) => {
          const active = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                "w-20 shrink-0 rounded-xl px-2 py-3 text-center ring-1 transition",
                active
                  ? "bg-neon text-charcoal ring-neon shadow-glow-sm"
                  : "bg-surface text-white/70 ring-white/10 hover:ring-neon/50"
              )}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide">
                {relativeDayLabel(date).split(", ")[0]}
              </span>
              <span className="mt-1 block font-display text-base font-bold">
                {new Date(`${date}T00:00:00`).getDate()}
              </span>
              <span className="block text-[10px] font-medium uppercase">
                {new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
                  month: "short",
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}