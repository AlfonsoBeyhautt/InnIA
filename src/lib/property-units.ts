import type { PropertyId, Reservation } from "@/types";

export interface PropertyUnit {
  id: string;
  propertyId: PropertyId;
  name: string;
  shortLabel: string;
}

export function unitsFromReservations(reservations: Reservation[]): PropertyUnit[] {
  const map = new Map<string, PropertyUnit>();
  for (const r of reservations) {
    const key = `${r.propertyId}:${r.unitId}`;
    if (map.has(key)) continue;
    const label = r.unitId.length > 12 ? r.unitId.slice(0, 8) : r.unitId;
    map.set(key, {
      id: r.unitId,
      propertyId: r.propertyId,
      name: label,
      shortLabel: label,
    });
  }
  return [...map.values()];
}

export function unitLabel(unitId: string, units?: PropertyUnit[]): string {
  return units?.find((u) => u.id === unitId)?.shortLabel ?? unitId;
}
