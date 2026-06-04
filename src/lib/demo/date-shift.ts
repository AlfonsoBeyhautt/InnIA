/** Mock data is anchored around this date so reservations stay visible near "today". */
const MOCK_ANCHOR = new Date("2026-05-17T12:00:00Z");

export function shiftMockIsoDate(isoDate: string): string {
  const base = new Date(`${isoDate}T12:00:00Z`);
  const offsetMs = Date.now() - MOCK_ANCHOR.getTime();
  const shifted = new Date(base.getTime() + offsetMs);
  return shifted.toISOString().slice(0, 10);
}

export function addDaysFromToday(dayOffset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export function addDaysToIso(isoDate: string, dayOffset: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}
