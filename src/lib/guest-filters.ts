import type { Guest } from "@/types";
import { downloadCsv } from "@/lib/export-csv";
import { propertyName } from "@/lib/utils";

export type GuestFilters = {
  search: string;
  status: string;
  platform: string;
  property: string;
  nationality: string;
  marketing: string;
  recurrent: string;
};

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function matchesSearch(guest: Guest, raw: string): boolean {
  const q = raw.toLowerCase().trim();
  if (!q) return true;

  const qDigits = normalizeDigits(q);
  const phoneDigits = guest.phone ? normalizeDigits(guest.phone) : "";
  const doc = (guest.documentId ?? "").toLowerCase();
  const passport = (guest.passportNumber ?? "").toLowerCase();

  return (
    guest.fullName.toLowerCase().includes(q) ||
    guest.name.toLowerCase().includes(q) ||
    (guest.email?.toLowerCase().includes(q) ?? false) ||
    doc.includes(q) ||
    passport.includes(q) ||
    doc.replace(/[.\s-]/g, "").includes(q.replace(/[.\s-]/g, "")) ||
    (qDigits.length >= 4 && phoneDigits.includes(qDigits))
  );
}

function matchesProperty(guest: Guest, propertyId: string): boolean {
  if (propertyId === "all") return true;
  if (guest.preferredPropertyId === propertyId) return true;
  return guest.reservationHistory.some((r) => r.propertyId === propertyId);
}

export function filterGuests(guests: Guest[], filters: GuestFilters): Guest[] {
  return guests.filter((g) => {
    if (!matchesSearch(g, filters.search)) return false;
    if (filters.status !== "all" && g.validationStatus !== filters.status) return false;
    if (filters.platform !== "all" && g.originPlatform !== filters.platform) return false;
    if (!matchesProperty(g, filters.property)) return false;
    if (
      filters.nationality !== "all" &&
      g.nationality?.toLowerCase() !== filters.nationality.toLowerCase()
    ) {
      return false;
    }
    if (filters.marketing === "yes" && !g.marketingConsent) return false;
    if (filters.marketing === "no" && g.marketingConsent) return false;
    if (filters.recurrent === "yes" && g.totalStays <= 1) return false;
    if (filters.recurrent === "no" && g.totalStays > 1) return false;
    return true;
  });
}

export function exportGuestsCsv(guests: Guest[], filename = "huespedes") {
  downloadCsv(
    filename,
    [
      "Nombre",
      "Email",
      "Teléfono",
      "Documento",
      "Pasaporte",
      "Nacionalidad",
      "Plataforma",
      "Estado validación",
      "Marketing",
      "Propiedad preferida",
      "Estadías",
    ],
    guests.map((g) => [
      g.fullName,
      g.email ?? "",
      g.phone ?? "",
      g.documentId ?? "",
      g.passportNumber ?? "",
      g.nationality ?? "",
      g.originPlatform ?? "",
      g.validationStatus,
      g.marketingConsent ? "Sí" : "No",
      g.preferredPropertyId ? propertyName(g.preferredPropertyId) : "",
      String(g.totalStays),
    ])
  );
}
