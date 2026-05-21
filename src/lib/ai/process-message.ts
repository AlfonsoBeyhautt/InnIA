import OpenAI from "openai";
import { getOpenAiApiKey } from "@/lib/config/env";
import { buildAiUserPrompt } from "@/lib/ai/build-context";
import {
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_SYSTEM_PROMPT,
  AI_TEMPERATURE,
} from "@/lib/ai/config";
import { getCategoryPromptSuffix } from "@/lib/ai/category-prompts";
import { applyIntentToConversation } from "@/lib/conversations/apply-intent";
import type { IntentCategory } from "@/types";
import {
  detectComplaintSignals,
  detectCommercialProposal,
  detectEscalationSignals,
  parseAndApplyAiRules,
  type ParsedAiResponse,
} from "@/lib/ai/parse-response";
import {
  deliverWhatsAppMessage,
  isWhatsAppChannel,
} from "@/lib/integrations/whatsapp/send-outbound";
import { WhatsAppSendError } from "@/lib/integrations/whatsapp-cloud";
import { getIntegrations } from "@/lib/db/queries";
import { getOwnerAiSettings } from "@/lib/ai/owner-settings";
import {
  getConversationById,
  getGuestById,
  getKnowledgeBase,
  getMessages,
  getPropertyById,
} from "@/lib/db/queries";
import { mapUnit } from "@/lib/db/mappers";
import { requireAuth } from "@/lib/auth/session";
import {
  createAiResponseLog,
  sendMessage,
  updateConversation,
  createNotification,
} from "@/lib/db/mutations";
import type { Unit } from "@/types";
import type { AiDecision, Tables } from "@/lib/supabase/types";

export type ProcessMessageResult = {
  decision: AiDecision;
  confidence: number;
  generatedResponse: string;
  usedKnowledge: string[];
  missingInformation: string[];
  reason: string;
  autoSent: boolean;
  autoSendFailed?: boolean;
  autoSendError?: string;
  messageId?: string;
  logId: string;
};

function buildOpenAI() {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY no configurada en el servidor");
  return new OpenAI({ apiKey: key });
}

const aiStatusMap: Record<AiDecision, string> = {
  auto_responder: "auto_sent",
  requiere_revision: "needs_review",
  informacion_insuficiente: "insufficient_info",
  escalar_dueno: "escalated",
};

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
  if (message.conversation_id !== input.conversationId) {
    throw new Error("El mensaje no pertenece a esta conversación");
  }
  if (message.sender_type !== "guest") {
    throw new Error("Solo se procesan mensajes de huéspedes");
  }

  const conversation = await getConversationById(input.conversationId);
  if (!conversation) throw new Error("Conversación no encontrada");

  const propertyDbId = conversation.propertyDbId;
  if (!propertyDbId) throw new Error("Propiedad no asociada a la conversación");

  const [property, guest, knowledge, recentMessages] = await Promise.all([
    getPropertyById(propertyDbId),
    getGuestById(conversation.guestId),
    getKnowledgeBase(propertyDbId),
    getMessages(input.conversationId),
  ]);

  let reservation: Tables<"reservations"> | null = null;
  let unit: Unit | null = null;

  if (conversation.reservationId) {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", conversation.reservationId)
      .maybeSingle<Tables<"reservations">>();
    reservation = data;

    if (reservation?.unit_id) {
      const { data: unitRow } = await supabase
        .from("units")
        .select("*")
        .eq("id", reservation.unit_id)
        .maybeSingle();
      if (unitRow) unit = mapUnit(unitRow);
    }
  }

  const ownerSettings = await getOwnerAiSettings();

  const escalationHint = detectEscalationSignals(message.body);
  const complaintHint = detectComplaintSignals(message.body);
  const commercialHint = detectCommercialProposal(message.body);

  let intentCategory = (conversation.intentCategory ?? "otro") as IntentCategory;
  if (intentCategory === "comercial") {
    // Reinforce commercial handling server-side
  }

  if (ownerSettings.ai_auto_classification !== false) {
    intentCategory = await applyIntentToConversation(input.conversationId, {
      messageText: message.body,
      hasReservation: Boolean(conversation.reservationId),
      channel: conversation.platform.toLowerCase(),
    });
  }

  const categorySuffix = getCategoryPromptSuffix(intentCategory);
  const systemPrompt = `${AI_SYSTEM_PROMPT}\n${categorySuffix}`;

  const userPrompt = buildAiUserPrompt({
    guestMessage: message.body,
    guest: guest ? { fullName: guest.fullName } : null,
    guestNameFallback: conversation.guestName,
    property,
    knowledge,
    reservation,
    unit,
    recentMessages,
  });

  const openai = buildOpenAI();
  let parsed: ParsedAiResponse;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: AI_TEMPERATURE,
      max_tokens: AI_MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    parsed = parseAndApplyAiRules(raw, { escalationHint, complaintHint });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al llamar a OpenAI";
    await createAiResponseLog({
      conversationId: input.conversationId,
      messageId: input.messageId,
      generatedResponse: "",
      usedKnowledge: [],
      missingInformation: [],
      aiDecision: "requiere_revision",
      autoSent: false,
    }).catch(() => undefined);

    await updateConversation(input.conversationId, {
      ai_status: "needs_review",
      priority: "revisar",
      labels: ["Requiere revisión"],
      unread: true,
    });

    throw new Error(
      msg.includes("API key") ? "OPENAI_API_KEY inválida o no configurada" : `OpenAI: ${msg}`
    );
  }

  if (escalationHint && parsed.decision !== "escalar_dueno") {
    parsed = {
      ...parsed,
      decision: "escalar_dueno",
      reason: `${parsed.reason} Señales de urgencia detectadas en el mensaje.`,
      confidence: Math.max(parsed.confidence, 0.85),
    };
  }

  if (commercialHint && parsed.decision === "auto_responder") {
    parsed = {
      ...parsed,
      decision: "requiere_revision",
      reason: `${parsed.reason} Propuesta comercial o caso que requiere revisión del dueño.`,
    };
  }

  const integrations = await getIntegrations();
  const waRow = integrations.find((i) => i.provider === "whatsapp_business");
  const waConfig = (waRow?.config as Record<string, unknown>) ?? {};
  const waAutoReply = waConfig.ai_auto_reply_enabled !== false;
  const aiAutoReplyEnabled =
    ownerSettings.ai_auto_reply_enabled !== false && waAutoReply;

  const decision = parsed.decision;
  const wantsAutoSend =
    decision === "auto_responder" &&
    Boolean(parsed.generatedResponse.trim()) &&
    intentCategory !== "comercial";
  const canDeliverWhatsApp =
    wantsAutoSend && aiAutoReplyEnabled && isWhatsAppChannel(conversation);

  let autoSent = false;
  let autoSendFailed = false;
  let autoSendError: string | undefined;
  let sentMessageId: string | undefined;

  if (canDeliverWhatsApp) {
    try {
      const delivered = await deliverWhatsAppMessage({
        conversationId: input.conversationId,
        text: parsed.generatedResponse,
        senderType: "ai",
        senderName: "InnIA",
        aiGenerated: true,
        aiAutoSent: true,
      });
      autoSent = true;
      sentMessageId = delivered.message.id;
    } catch (e) {
      autoSendFailed = true;
      autoSendError =
        e instanceof WhatsAppSendError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo enviar por WhatsApp";
    }
  } else if (wantsAutoSend && aiAutoReplyEnabled && !isWhatsAppChannel(conversation)) {
    const sent = await sendMessage({
      conversationId: input.conversationId,
      senderType: "ai",
      body: parsed.generatedResponse,
      senderName: "InnIA",
      aiGenerated: true,
      aiAutoSent: true,
    });
    autoSent = true;
    sentMessageId = sent.id;
  }

  const log = await createAiResponseLog({
    conversationId: input.conversationId,
    messageId: input.messageId,
    generatedResponse: parsed.generatedResponse,
    usedKnowledge: parsed.usedKnowledge,
    missingInformation: parsed.missingInformation,
    aiDecision: decision,
    autoSent,
  });

  const labels: string[] = autoSent
    ? ["Respondido por IA"]
    : decision === "escalar_dueno"
      ? ["Urgente", "Requiere revisión"]
      : wantsAutoSend && (autoSendFailed || !aiAutoReplyEnabled)
        ? ["Requiere revisión"]
        : decision === "auto_responder"
          ? ["Respondido por IA"]
          : ["Requiere revisión"];

  const effectiveAiStatus = autoSent
    ? "auto_sent"
    : autoSendFailed || (wantsAutoSend && !aiAutoReplyEnabled)
      ? "needs_review"
      : aiStatusMap[decision];

  await updateConversation(input.conversationId, {
    ai_status: effectiveAiStatus,
    priority:
      decision === "escalar_dueno"
        ? "urgente"
        : effectiveAiStatus === "needs_review" ||
            effectiveAiStatus === "insufficient_info"
          ? "revisar"
          : "normal",
    labels,
    unread: !autoSent,
  });

  if (autoSent) {
    await createNotification({
      type: "ia",
      title: "IA respondió automáticamente",
      body: `Respuesta enviada a ${conversation.guestName} en ${property?.name ?? "propiedad"}.`,
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  } else if (autoSendFailed) {
    await createNotification({
      type: "ia",
      title: "Error al enviar respuesta automática",
      body: autoSendError ?? "No se pudo enviar por WhatsApp.",
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  } else if (decision === "informacion_insuficiente") {
    await createNotification({
      type: "ia",
      title: "Completar base de conocimiento",
      body:
        parsed.missingInformation.join(" · ") ||
        "Falta información para responder con seguridad.",
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  } else if (decision === "escalar_dueno") {
    await createNotification({
      type: "ia",
      title: "Conversación escalada",
      body: `${conversation.guestName}: requiere atención del dueño. ${parsed.reason}`,
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  } else if (decision === "requiere_revision") {
    await createNotification({
      type: "ia",
      title: "Mensaje pendiente de revisión",
      body: `IA sugiere revisar la conversación con ${conversation.guestName}.`,
      relatedEntityType: "conversation",
      relatedEntityId: input.conversationId,
    });
  }

  return {
    decision,
    confidence: parsed.confidence,
    generatedResponse: parsed.generatedResponse,
    usedKnowledge: parsed.usedKnowledge,
    missingInformation: parsed.missingInformation,
    reason: parsed.reason,
    autoSent,
    autoSendFailed: autoSendFailed || undefined,
    autoSendError,
    messageId: sentMessageId,
    logId: log.id,
  };
}
