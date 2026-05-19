import type { Reservation } from "@/types";

export const DAY_WIDTH = 52;
export const ROW_HEIGHT = 44;
export const UNIT_COL_WIDTH = 200;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayHeader(date: Date): { day: string; weekday: string; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return {
    day: String(date.getDate()),
    weekday: new Intl.DateTimeFormat("es-UY", { weekday: "short" }).format(date),
    isToday: d.getTime() === today.getTime(),
  };
}

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function generateDateRange(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function reservationBarStyle(
  reservation: Reservation,
  rangeStart: Date,
  totalDays: number
): { left: number; width: number } | null {
  const checkIn = parseDate(reservation.checkIn);
  const checkOut = parseDate(reservation.checkOut);
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const endRange = addDays(start, totalDays);

  if (checkOut <= start || checkIn >= endRange) return null;

  const visibleStart = checkIn < start ? start : checkIn;
  const visibleEnd = checkOut > endRange ? endRange : checkOut;
  const offsetDays = daysBetween(start, visibleStart);
  const spanDays = daysBetween(visibleStart, visibleEnd);

  return {
    left: offsetDays * DAY_WIDTH + 2,
    width: Math.max(spanDays * DAY_WIDTH - 4, 24),
  };
}

/** Colores PMS profesionales — fondo sólido, texto claro */
export const platformTimelineStyles: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  Airbnb: { bg: "#9B2335", border: "#7A1C2A", text: "#FFFFFF" },
  Booking: { bg: "#1E4A8C", border: "#163A6E", text: "#FFFFFF" },
  Directa: { bg: "#1F5C45", border: "#184A38", text: "#FFFFFF" },
  WhatsApp: { bg: "#1A6B5C", border: "#145548", text: "#FFFFFF" },
  Email: { bg: "#475569", border: "#334155", text: "#FFFFFF" },
};
