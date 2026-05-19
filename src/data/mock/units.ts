import type { PropertyId } from "@/types";

export interface PropertyUnit {
  id: string;
  propertyId: PropertyId;
  name: string;
  shortLabel: string;
}

/** Unidades por propiedad — una reserva ocupa una unidad; sin solapamiento en el mismo día */
export const propertyUnits: PropertyUnit[] = [
  { id: "pdd-1", propertyId: "pdd", name: "Apartamento 1", shortLabel: "Apto 1" },
  { id: "pdd-2", propertyId: "pdd", name: "Apartamento 2", shortLabel: "Apto 2" },
  { id: "pdd-3", propertyId: "pdd", name: "Apartamento 3", shortLabel: "Apto 3" },
  { id: "rocha-1", propertyId: "rocha", name: "Cabaña completa", shortLabel: "Cabaña" },
  { id: "paloma-1", propertyId: "paloma", name: "Apartamento 404", shortLabel: "404" },
  { id: "paloma-2", propertyId: "paloma", name: "Apartamento 405", shortLabel: "405" },
];

export function unitLabel(unitId: string): string {
  return propertyUnits.find((u) => u.id === unitId)?.shortLabel ?? unitId;
}
