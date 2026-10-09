"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, formatDateLong, relativeDayLabel } from "@/lib/utils";

const VISIBLE_DAYS = 10;

interface DateStripPickerProps {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
  step?: number;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DateStripPicker({
  dates,
  selectedDate,
  onSelect,
  step = 1,
}: DateStripPickerProps) {
  const maxStart = Math.max(0, dates.length - VISIBLE_DAYS);
  const [startIndex, setStartIndex] = useState(0);

  const start = Math.min(Math.max(startIndex, 0), maxStart);
  const visibleDates = useMemo(
    () => dates.slice(start, start + VISIBLE_DAYS),
    [dates, start]
  );

  useEffect(() => {
    const selectedIndex = dates.indexOf(selectedDate);
    if (selectedIndex === -1) return;
    setStartIndex((current) => {
      const currentStart = Math.min(Math.max(current, 0), maxStart);
      if (selectedIndex < currentStart) return selectedIndex;
      if (selectedIndex >= currentStart + VISIBLE_DAYS) {
        return selectedIndex - VISIBLE_DAYS + 1;
      }
      return currentStart;
    });
  }, [selectedDate, dates, maxStart]);

  const shift = useCallback(
    (delta: number) => {
      setStartIndex((current) => {
        const currentStart = Math.min(Math.max(current, 0), maxStart);
        return Math.min(Math.max(currentStart + delta, 0), maxStart);
      });
    },
    [maxStart]
  );

  const canGoBack = start > 0;
  const canGoForward = start < maxStart;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Pick a day</h2>
        <span className="hidden text-sm text-white/50 sm:block">
          {formatDateLong(selectedDate)}
        </span>
      </div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => shift(-step)}
          disabled={!canGoBack}
          aria-label="Previous days"
          className="flex w-9 shrink-0 items-center justify-center rounded-xl bg-[#18191c] text-[#c4f03a] ring-1 ring-white/10 transition hover:ring-[#c4f03a]/50 disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:ring-white/10"
        >
          <Chevron direction="left" />
        </button>

        <div className="grid min-w-0 flex-1 grid-cols-10 gap-1.5 sm:gap-2">
          {visibleDates.map((date) => {
            const active = date === selectedDate;
            const parsed = new Date(`${date}T00:00:00`);
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                className={cn(
                  "min-w-0 overflow-hidden rounded-xl bg-[#18191c] px-1 py-3 text-center ring-1 transition",
                  active
                    ? "bg-[#c4f03a] font-bold text-[#18191c] ring-[#c4f03a]"
                    : "text-white/70 ring-white/10 hover:ring-[#c4f03a]/50"
                )}
              >
                <span className="block truncate text-[9px] font-semibold uppercase tracking-wide sm:text-[10px]">
                  {relativeDayLabel(date).split(", ")[0]}
                </span>
                <span className="mt-1 block font-display text-sm font-bold sm:text-base">
                  {parsed.getDate()}
                </span>
                <span className="block truncate text-[9px] font-medium uppercase tracking-wide sm:text-[10px]">
                  {parsed.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => shift(step)}
          disabled={!canGoForward}
          aria-label="Next days"
          className="flex w-9 shrink-0 items-center justify-center rounded-xl bg-[#18191c] text-[#c4f03a] ring-1 ring-white/10 transition hover:ring-[#c4f03a]/50 disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:ring-white/10"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}
