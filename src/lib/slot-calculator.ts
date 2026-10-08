import type { PeriodGroup, SlotPeriod, TimeSlot } from "@/types/booking";

export const DEFAULT_OPENING = "06:00";
export const DEFAULT_CLOSING = "23:00";
export const SLOT_STEP_MINUTES = 60;

export const PERIODS: {
  key: SlotPeriod;
  label: string;
  hint: string;
  from: number;
  to: number;
}[] = [
  { key: "DAY", label: "Day Slots", hint: "Morning to afternoon", from: 360, to: 960 },
  { key: "EVENING", label: "Evening Slots", hint: "Golden hour games", from: 960, to: 1200 },
  { key: "NIGHT", label: "Night Slots", hint: "Floodlit sessions", from: 1200, to: 1440 },
];

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number) {
  const clamped = Math.min(Math.max(minutes, 0), 1440);
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getPeriod(time: string): SlotPeriod {
  const minutes = toMinutes(time);
  const period = PERIODS.find((p) => minutes >= p.from && minutes < p.to);
  return period ? period.key : "NIGHT";
}

export function generateSlotRanges(opening: string, closing: string) {
  const ranges: { startTime: string; endTime: string }[] = [];
  let cursor = toMinutes(opening);
  const end = toMinutes(closing);

  while (cursor + SLOT_STEP_MINUTES <= end) {
    ranges.push({
      startTime: toTime(cursor),
      endTime: toTime(cursor + SLOT_STEP_MINUTES),
    });
    cursor += SLOT_STEP_MINUTES;
  }

  return ranges;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export function isContiguous(slots: { startTime: string; endTime: string }[]) {
  if (slots.length <= 1) return true;
  const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime !== sorted[i - 1].endTime) return false;
  }
  return true;
}

export function rangeMinutes(start: string, end: string) {
  return toMinutes(end) - toMinutes(start);
}

export function hoursLabel(start: string, end: string) {
  const minutes = rangeMinutes(start, end);
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? "hr" : "hrs"}`;
}

export function buildPeriodGroups(slots: TimeSlot[]): PeriodGroup[] {
  return PERIODS.map((period) => ({
    key: period.key,
    label: period.label,
    hint: period.hint,
    slots: slots.filter((slot) => slot.period === period.key),
  })).filter((group) => group.slots.length > 0);
}

export function selectRangeBounds(slots: { startTime: string; endTime: string }[]) {
  const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  };
}

export function buildTimeOptions(opening: string, closing: string) {
  return generateSlotRanges(opening, closing).map((range) => range.startTime).concat(closing);
}
