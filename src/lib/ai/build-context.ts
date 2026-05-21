import type { KnowledgeBaseItem, Message, Property, Unit } from "@/types";
import type { Tables } from "@/lib/supabase/types";
import { AI_RECENT_MESSAGES_LIMIT } from "@/lib/ai/config";
import {
  formatGuestContextBlock,
  type ConversationGuestContext,
} from "@/lib/ai/conversation-entities";
import { shouldUseGreeting } from "@/lib/ai/conversational-style";

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
  guestContext?: ConversationGuestContext | null;
  platform?: string;
}): string {
  const { property, knowledge, reservation, unit, recentMessages } = input;
  const guestName = input.guest?.fullName ?? input.guestNameFallback;
  const allowGreeting = shouldUseGreeting(recentMessages);

  const knowledgeBlock = knowledge.length
    ? knowledge
        .map(
          (k) =>
            `• [${k.category ?? k.topic}] (${k.status}): ${k.content?.trim() || "(sin contenido)"}`
        )
        .join("\n")
    : "(sin entradas en base de conocimiento)";

  const propertyBlock = property
    ? `Nombre comercial: ${property.name} (hablá como "nosotros", no como tercero)
Ubicación: ${property.location}
Check-in: ${property.checkInTime ?? "consultar"} — Llegada: ${property.checkInInstructions?.trim() || "no cargado"}
Check-out: ${property.checkOutTime ?? "consultar"}
WiFi: ${property.wifiName?.trim() ? `red ${property.wifiName}` : "no cargado"}${property.wifiPassword?.trim() ? " (clave en sistema)" : ""}
Estacionamiento: ${property.parkingInfo?.trim() || "no cargado"}
Mascotas: ${property.petPolicy?.trim() || "no cargado"}
Reglas: ${property.houseRules?.trim() || "no cargadas"}
Acceso/cerradura: ${property.lockInstructions?.trim() || "no cargado"}
Emergencias: ${property.emergencyContact?.trim() || "no cargado"}`
    : "(sin datos de propiedad)";

  const reservationBlock = reservation
    ? `Reserva activa: ${reservation.check_in} → ${reservation.check_out}, ${reservation.guests_count} huésped(es), estado ${reservation.status}`
    : "Sin reserva confirmada vinculada.";

  const unitBlock = unit
    ? `Unidad: ${unit.name} (hasta ${unit.capacity} personas)`
    : "";

  const history = recentMessages
    .slice(-AI_RECENT_MESSAGES_LIMIT)
    .map((m) => {
      const who =
        m.sender === "guest" ? "Huésped" : m.sender === "ai" ? "Equipo" : "Anfitrión";
      return `${who}: ${m.content}`;
    })
    .join("\n");

  const greetingRule = allowGreeting
    ? "Podés saludar brevemente si suma (es inicio de conversación)."
    : "NO saludes ni uses 'Hola [nombre]' — respondé directo al punto.";

  return `MENSAJE ACTUAL DEL HUÉSPED (respondé a esto):
"${input.guestMessage}"

CANAL: ${input.platform ?? "WhatsApp"} — estilo chat móvil, MUY breve.

HUÉSPED: ${guestName}
${greetingRule}

DATOS YA CONOCIDOS DEL HUÉSPED (NO volver a preguntar si ya están):
${formatGuestContextBlock(input.guestContext)}

RESERVA
${reservationBlock}
${unitBlock}

INFO DEL ALOJAMIENTO (usá en primera persona: "tenemos", "podés")
${propertyBlock}

BASE DE CONOCIMIENTO
${knowledgeBlock}

HISTORIAL COMPLETO RECIENTE (${recentMessages.length} mensajes — leé todo antes de responder)
${history || "(primer mensaje)"}`;
}
