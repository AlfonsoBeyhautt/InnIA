import type { KnowledgeBaseItem, Message, Property, Unit } from "@/types";
import type { Tables } from "@/lib/supabase/types";
import { AI_RECENT_MESSAGES_LIMIT } from "@/lib/ai/config";

type GuestSummary = { fullName: string } | null;

export function buildAiUserPrompt(input: {
  guestMessage: string;
  guest: GuestSummary;
  guestNameFallback: string;
  property: Property | null;
  knowledge: KnowledgeBaseItem[];
  reservation: Tables<"reservations"> | null;
  unit: Unit | null;
  recentMessages: Message[];
}): string {
  const { property, knowledge, reservation, unit, recentMessages } = input;
  const guestName = input.guest?.fullName ?? input.guestNameFallback;

  const knowledgeBlock = knowledge.length
    ? knowledge
        .map(
          (k) =>
            `• [${k.category ?? k.topic}] (${k.status}): ${k.content?.trim() || "(sin contenido)"}`
        )
        .join("\n")
    : "(sin entradas en knowledge_base_items)";

  const propertyBlock = property
    ? `Nombre: ${property.name}
Ubicación: ${property.location}
Check-in: ${property.checkInTime ?? "no indicado"} — Instrucciones llegada: ${property.checkInInstructions?.trim() || "no cargadas"}
Check-out: ${property.checkOutTime ?? "no indicado"}
WiFi red: ${property.wifiName?.trim() || "no cargada"}
WiFi clave: ${property.wifiPassword?.trim() ? "(disponible en sistema)" : "no cargada"}
Estacionamiento: ${property.parkingInfo?.trim() || "no cargado"}
Mascotas: ${property.petPolicy?.trim() || "no cargado"}
Reglas de la casa: ${property.houseRules?.trim() || "no cargadas"}
Cerradura / acceso: ${property.lockInstructions?.trim() || "no cargado"}
Emergencias: ${property.emergencyContact?.trim() || "no cargado"}
Notas internas (solo referencia, no compartir tal cual): ${property.internalNotes?.trim() || "—"}`
    : "(propiedad no encontrada)";

  const reservationBlock = reservation
    ? `ID reserva: ${reservation.id}
Fechas: ${reservation.check_in} → ${reservation.check_out}
Estado: ${reservation.status}
Huéspedes: ${reservation.guests_count}
Plataforma: ${reservation.platform}`
    : "Sin reserva vinculada a esta conversación.";

  const unitBlock = unit
    ? `Unidad: ${unit.name} (capacidad ${unit.capacity}, estado ${unit.status})`
    : reservation
      ? "Unidad no encontrada en sistema."
      : "Sin unidad asociada.";

  const history = recentMessages
    .slice(-AI_RECENT_MESSAGES_LIMIT)
    .map((m) => {
      const who =
        m.sender === "guest" ? "Huésped" : m.sender === "ai" ? "IA" : "Anfitrión";
      return `${who}: ${m.content}`;
    })
    .join("\n");

  return `MENSAJE ACTUAL DEL HUÉSPED (procesar este):
"${input.guestMessage}"

HUÉSPED
Nombre: ${guestName}

RESERVA
${reservationBlock}

UNIDAD
${unitBlock}

PROPIEDAD
${propertyBlock}

BASE DE CONOCIMIENTO (knowledge_base_items)
${knowledgeBlock}

HISTORIAL RECIENTE DE LA CONVERSACIÓN
${history || "(sin mensajes previos)"}`;
}
