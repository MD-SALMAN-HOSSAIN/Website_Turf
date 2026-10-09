import type { PeriodGroup, SlotPeriod, TimeSlot } from "@/types/booking";

export const DEFAULT_OPENING = "06:00";
export const DEFAULT_CLOSING = "23:00";
export const SLOT_STEP_MINUTES = 60;

export const FOOTBALL_SLOT_MINUTES = 90;
export const FOOTBALL_GAP_MINUTES = 30;
export const FOOTBALL_CLOSING = "01:00";

export const SWIMMING_OPENING = "06:00";
export const SWIMMING_CLOSING = "22:00";
export const SWIMMING_SLOT_MINUTES = 120;

export interface SlotConfig {
  opening: string;
  closing: string;
  slotMinutes: number;
  gapMinutes: number;
}

export const PERIODS: {
  key: SlotPeriod;
  label: string;
  hint: string;
  from: number;
  to: number;
}[] = [
  { key: "DAY", label: "Day Slots", hint: "Morning to afternoon", from: 360, to: 960 },
  { key: "EVENING", label: "Evening Slots", hint: "Golden hour games", from: 960, to: 1200 },
  { key: "NIGHT", label: "Night Slots", hint: "Floodlit sessions", from: 1200, to: 1500 },
];

export function isFootballSport(sport: string) {
  return sport.trim().toLowerCase() === "football";
}

export function isSwimmingSport(sport: string) {
  return sport.trim().toLowerCase() === "swimming";
}

export function getPitchSlotConfig(
  pitch: { sport: string },
  siteOpening: string,
  siteClosing: string
): SlotConfig {
  if (isFootballSport(pitch.sport)) {
    return {
      opening: siteOpening,
      closing: FOOTBALL_CLOSING,
      slotMinutes: FOOTBALL_SLOT_MINUTES,
      gapMinutes: FOOTBALL_GAP_MINUTES,
    };
  }
  if (isSwimmingSport(pitch.sport)) {
    return {
      opening: SWIMMING_OPENING,
      closing: SWIMMING_CLOSING,
      slotMinutes: SWIMMING_SLOT_MINUTES,
      gapMinutes: 0,
    };
  }
  return {
    opening: siteOpening,
    closing: siteClosing,
    slotMinutes: SLOT_STEP_MINUTES,
    gapMinutes: 0,
  };
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Maps a wall-clock time onto a linear timeline anchored at the slot window's
 * opening time. Times that fall before opening (e.g. 01:00 when the venue opens
 * at 06:00) are treated as the next calendar day so overnight slots compare and
 * price correctly.
 */
export function toWindowMinutes(time: string, opening: string) {
  const minutes = toMinutes(time);
  const openMinutes = toMinutes(opening);
  return minutes < openMinutes ? minutes + 1440 : minutes;
}

export function getPeriod(time: string): SlotPeriod {
  const minutes = toMinutes(time);
  const period = PERIODS.find((p) => minutes >= p.from && minutes < p.to);
  return period ? period.key : "NIGHT";
}

export function generateSlotRanges(
  opening: string,
  closing: string,
  slotMinutes: number = SLOT_STEP_MINUTES,
  gapMinutes: number = 0
) {
  const ranges: { startTime: string; endTime: string }[] = [];
  const end = toWindowMinutes(closing, opening);
  let cursor = toMinutes(opening);

  while (cursor + slotMinutes <= end) {
    ranges.push({
      startTime: toTime(cursor),
      endTime: toTime(cursor + slotMinutes),
    });
    cursor += slotMinutes + gapMinutes;
  }

  if (gapMinutes > 0 && ranges.length > 0) {
    const lastEnd = cursor - gapMinutes;
    if (lastEnd + slotMinutes <= end) {
      ranges.push({
        startTime: toTime(lastEnd),
        endTime: toTime(lastEnd + slotMinutes),
      });
    }
  }

  return ranges;
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
  opening: string = "00:00"
) {
  return (
    toWindowMinutes(aStart, opening) < toWindowMinutes(bEnd, opening) &&
    toWindowMinutes(bStart, opening) < toWindowMinutes(aEnd, opening)
  );
}

export function isContiguous(slots: { startTime: string; endTime: string }[]) {
  if (slots.length <= 1) return true;
  const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime !== sorted[i - 1].endTime) return false;
  }
  return true;
}

export function rangeMinutes(start: string, end: string, opening: string = "00:00") {
  return toWindowMinutes(end, opening) - toWindowMinutes(start, opening);
}

export function hoursLabel(start: string, end: string, opening: string = "00:00") {
  const minutes = rangeMinutes(start, end, opening);
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

export function selectRangeBounds(
  slots: { startTime: string; endTime: string }[],
  opening: string = "00:00"
) {
  const sorted = [...slots].sort(
    (a, b) => toWindowMinutes(a.startTime, opening) - toWindowMinutes(b.startTime, opening)
  );
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  };
}

export function buildTimeOptions(config: SlotConfig) {
  const ranges = generateSlotRanges(
    config.opening,
    config.closing,
    config.slotMinutes,
    config.gapMinutes
  );
  const times = new Set<string>();
  for (const range of ranges) {
    times.add(range.startTime);
    times.add(range.endTime);
  }
  times.add(config.opening);
  times.add(config.closing);
  return Array.from(times).sort(
    (a, b) => toWindowMinutes(a, config.opening) - toWindowMinutes(b, config.opening)
  );
}
