import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBdt(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatHourRange(start: string, end: string) {
  return `${to12Hour(start)} – ${to12Hour(end)}`;
}

export function to12Hour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 5)}****${digits.slice(-3)}`;
}

export function maskNid(nid: string) {
  const digits = nid.replace(/\D/g, "");
  if (digits.length < 6) return nid;
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export const CANCELLATION_WINDOW_HOURS = 16;

export function slotStartDate(date: string, startTime: string) {
  return new Date(`${date}T${startTime}:00`);
}

export function hoursUntilSlot(date: string, startTime: string) {
  return (slotStartDate(date, startTime).getTime() - Date.now()) / (60 * 60 * 1000);
}

export function formatDateLong(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function relativeDayLabel(iso: string) {
  const today = todayIso();
  if (iso === today) return "Today";
  if (iso === addDaysIso(today, 1)) return "Tomorrow";
  return formatDateShort(iso);
}
