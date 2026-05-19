import OpenAI from "openai";
import { getOpenAiApiKey } from "@/lib/config/env";
import {
  getConversationById,
  getKnowledgeBase,
  getPropertyById,
  getGuestById,
} from "@/lib/db/queries";
import { requireAuth } from "@/lib/auth/session";
import {
  createAiResponseLog,
  sendMessage,
  updateConversation,
  createNotification,
} from "@/lib/db/mutations";
import type { AiDecision, Tables } from "@/lib/supabase/types";

export type ProcessMessageResult = {
  decision: AiDecision;
  response: string;
  usedKnowledge: string[];
  missingInformation: string[];
  autoSent: boolean;
  messageId?: string;
  logId: string;
};

function buildOpenAI() {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY no configurada");
  return new OpenAI({ apiKey: key });
}

export async function processMessageWithAi(input: {
  conversationId: string;
  messageId: string;
}): Promise<ProcessMessageResult> {
  const { supabase } = await requireAuth();

  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .select("*")
    .eq("id", input.messageId)
    .single<Tables<"messages">>();

  if (msgErr || !message) throw new Error("Mensaje no encontrado");
  if (message.sender_type !== "guest") {
    throw new Error("Solo se procesan mensajes de huéspedes");
  }

  const conversation = await getConversationById(input.conversationId);
  if (!conversation) throw new Error("Conversación no encontrada");

  const propertyDbId = conversation.propertyDbId;
  if (!propertyDbId) throw new Error("Propiedad no asociada");

  const property = await getPropertyById(propertyDbId);
  const guest = await getGuestById(conversation.guestId);
  const knowledge = await getKnowledgeBase(propertyDbId);

  let reservation: Tables<"reservations"> | null = null;
  if (conversation.reservationId) {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", conversation.reservationId)
      .maybeSingle<Tables<"reservations">>();
    reservation = data;
  }

  const knowledgeContext = knowledge
    .map(
      (k) =>
        `- [${k.category ?? k.topic}] (${k.status}): ${k.content ?? "(sin contenido)"}`
    )
    .join("\n");

  const propertyContext = property
    ? `
Propiedad: ${property.name}
Ubicación: ${property.location}
Check-in: ${property.checkInTime ?? "15:00"}
Check-out: ${property.checkOutTime ?? "10:00"}
WiFi: ${property.wifiName ?? "—"} / ${property.wifiPassword ? "***" : "—"}
Estacionamiento: ${property.parkingInfo ?? "no cargado"}
Mascotas: ${property.petPolicy ?? "no cargado"}
Reglas: ${property.houseRules ?? "—"}
Cerradura: ${property.lockInstructions ?? "—"}
Emergencia: ${property.emergencyContact ?? "—"}
`
    : "";

  const systemPrompt = `Eres el asistente de mensajería de InnIA para alquileres temporales.
Responde en español, tono profesional y cercano.
Analiza si tienes información SUFICIENTE en la base de conocimiento y datos de la propiedad.

Debes responder SOLO con JSON válido:
{
  "decision": "auto_responder" | "requiere_revision" | "informacion_insuficiente" | "escalar_dueno",
  "response": "texto de respuesta al huésped (vacío si informacion_insuficiente)",
  "used_knowledge": ["lista de fuentes usadas"],
  "missing_information": ["qué debe cargar el dueño si falta info"]
}

Reglas:
- auto_responder: solo si la respuesta es segura y completa con los datos disponibles.
- informacion_insuficiente: si falta dato crítico (ej. estacionamiento sin cargar).
- requiere_revision: facturas, reclamos, negociación, casos ambiguos.
- escalar_dueno: cerraduras, emergencias, seguridad.`;

  const userPrompt = `
Mensaje del huésped: "${message.body}"

Huésped: ${guest?.fullName ?? conversation.guestName}
Reserva: ${reservation ? `${reservation.check_in} → ${reservation.check_out}` : "sin reserva vinculada"}

${propertyContext}

Base de conocimiento:
${knowledgeContext || "(vacía)"}
`;

  const openai = buildOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: {
    decision: AiDecision;
    response: string;
    used_knowledge: string[];
    missing_information: string[];
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      decision: "requiere_revision",
      response: "Gracias por tu mensaje. Un miembro del equipo te responderá en breve.",
      used_knowledge: [],
      missing_information: [],
    };
  }

  const decision = parsed.decision ?? "requiere_revision";
  const autoSend = decision === "auto_responder" && Boolean(parsed.response?.trim());

  const log = await createAiResponseLog({
    conversationId: input.conversationId,
    messageId: input.messageId,
    generatedResponse: parsed.response ?? "",
    usedKnowledge: parsed.used_knowledge ?? [],
    missingInformation: parsed.missing_information ?? [],
    aiDecision: decision,
    autoSent: autoSend,
  });

  const aiStatusMap: Record<AiDecision, string> = {
    auto_responder: "auto_sent",
    requiere_revision: "needs_review",
    informacion_insuficiente: "insufficient_info",
    escalar_dueno: "escalated",
  };

  const labels =
    decision === "auto_responder"
      ? ["Respondido por IA"]
      : decision === "informacion_insuficiente"
        ? ["Requiere revisión"]
        : ["Requiere revisión"];

  await updateConversation(input.conversationId, {
    ai_status: aiStatusMap[decision],
    priority:
      decision === "escalar_dueno"
        ? "urgente"
        : decision === "requiere_revision"
          ? "revisar"
          : "normal",
    labels,
    unread: !autoSend,
  });

  let sentMessageId: string | undefined;

  if (autoSend && parsed.response) {
    const sent = await sendMessage({
      conversationId: input.conversationId,
      senderType: "ai",
      body: parsed.response,
      senderName: "InnIA",
      aiGenerated: true,
      aiAutoSent: true,
    });
    sentMessageId = sent.id;

    await createNotification({
      type: "ia",
      title: "IA respondió automáticamente",
      body: `Respuesta enviada a ${conversation.guestName}`,
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  } else if (decision === "informacion_insuficiente") {
    await createNotification({
      type: "ia",
      title: "Información insuficiente para IA",
      body: (parsed.missing_information ?? []).join(" ") || "Completá la base de conocimiento.",
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  }

  return {
    decision,
    response: parsed.response ?? "",
    usedKnowledge: parsed.used_knowledge ?? [],
    missingInformation: parsed.missing_information ?? [],
    autoSent: autoSend,
    messageId: sentMessageId,
    logId: log.id,
  };
}
