import type { IntentCategory } from "@/types";

export type ClassifyIntentInput = {
  messageText: string;
  hasReservation: boolean;
  channel?: string;
  recentMessages?: string[];
};

const COMMERCIAL_PATTERNS = [
  /influencer/i,
  /canje/i,
  /colaboraci[oó]n/i,
  /fot[oó]grafo/i,
  /agencia/i,
  /marca\b/i,
  /prensa/i,
  /marketing/i,
  /publicidad/i,
  /sponsor/i,
  /embajador/i,
  /ugc/i,
  /propuesta comercial/i,
];

const INQUIRY_PATTERNS = [
  /disponibil/i,
  /precio/i,
  /tarifa/i,
  /cu[aá]nto\s+cuesta/i,
  /fechas/i,
  /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i,
  /ubicaci[oó]n/i,
  /mascota/i,
  /capacidad/i,
  /personas/i,
  /hu[eé]sped/i,
  /reservar/i,
  /reserva/i,
  /noches/i,
  /estad[ií]a/i,
  /pago/i,
  /transferencia/i,
  /dep[oó]sito/i,
  /condiciones/i,
];

const ACTIVE_GUEST_PATTERNS = [
  /check-?in/i,
  /check-?out/i,
  /wifi/i,
  /wi-?fi/i,
  /clave/i,
  /c[oó]digo/i,
  /cerradura/i,
  /puerta/i,
  /no\s+puedo\s+entrar/i,
  /llegamos/i,
  /llegu[eé]/i,
  /estamos\s+en/i,
  /reglas/i,
  /normas/i,
  /estacionamiento/i,
  /parking/i,
  /problema/i,
  /roto|rota/i,
  /no\s+funciona/i,
  /soporte/i,
  /ayuda\s+urgente/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Classify conversation intent from message content and reservation context */
export function classifyConversationIntent(
  input: ClassifyIntentInput
): IntentCategory {
  const combined = [
    input.messageText,
    ...(input.recentMessages ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!combined.trim()) {
    return input.hasReservation ? "huesped_activo" : "otro";
  }

  if (matchesAny(combined, COMMERCIAL_PATTERNS)) {
    return "comercial";
  }

  if (input.hasReservation) {
    if (matchesAny(combined, ACTIVE_GUEST_PATTERNS)) {
      return "huesped_activo";
    }
    return "huesped_activo";
  }

  if (matchesAny(combined, ACTIVE_GUEST_PATTERNS) && !matchesAny(combined, INQUIRY_PATTERNS)) {
    return "huesped_activo";
  }

  if (matchesAny(combined, INQUIRY_PATTERNS)) {
    return "nueva_consulta";
  }

  return "otro";
}

export const INTENT_CATEGORY_LABELS: Record<IntentCategory, string> = {
  nueva_consulta: "Nueva consulta",
  huesped_activo: "Huésped activo",
  comercial: "Comercial",
  otro: "Otro",
};

export const PRIMARY_PLATFORMS = [
  "WhatsApp",
  "Instagram",
  "Airbnb",
  "Booking",
] as const;

export function isPrimaryInboxPlatform(platform: string): boolean {
  return (PRIMARY_PLATFORMS as readonly string[]).includes(platform);
}
