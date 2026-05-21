import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { unitLabel } from "@/lib/property-units";
import type { PropertyId } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function filterByProperty<T extends { propertyId: PropertyId }>(
  items: T[],
  selected: PropertyId
): T[] {
  if (selected === "all") return items;
  return items.filter((i) => i.propertyId === selected);
}

export const PROPERTY_OPTIONS = [{ id: "all" as const, name: "Todas las propiedades" }];

export function propertyName(id: PropertyId): string {
  if (id === "all") return "Todas las propiedades";
  return id;
}

export const platformColors: Record<string, string> = {
  Airbnb: "bg-[#9B2335]/10 text-[#7A1C2A] border-[#9B2335]/25",
  Booking: "bg-[#1E4A8C]/10 text-[#1E4A8C] border-[#1E4A8C]/25",
  WhatsApp: "bg-[#1A6B5C]/10 text-[#1A6B5C] border-[#1A6B5C]/25",
  Email: "bg-slate-100 text-slate-700 border-slate-200",
  Directa: "bg-[#1F5C45]/10 text-[#1F5C45] border-[#1F5C45]/25",
};

export const platformBlockStyles: Record<string, string> = {
  Airbnb: "bg-[#9B2335] border-[#7A1C2A] text-white",
  Booking: "bg-[#1E4A8C] border-[#163A6E] text-white",
  WhatsApp: "bg-[#1A6B5C] border-[#145548] text-white",
  Email: "bg-slate-600 border-slate-700 text-white",
  Directa: "bg-[#1F5C45] border-[#184A38] text-white",
};

export function unitName(unitId: string): string {
  return unitLabel(unitId);
}

export function propertyAbbrev(id: PropertyId): string {
  if (id === "all") return "—";
  return id.length > 8 ? id.slice(0, 6) : id;
}
