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
import {
  buildContextFromMessages,
  mergeGuestContext,
  extractEntitiesFromText,
} from "@/lib/ai/conversation-entities";
import {
  polishGeneratedResponse,
  shouldUseGreeting,
} from "@/lib/ai/conversational-style";
import {
  detectComplaintSignals,
  detectCommercialProposal,
  detectEscalationSignals,
  parseAndApplyAiRules,
  type ParsedAiResponse,
} from "@/lib/ai/parse-response";
import {
  deliverWhatsAppForOwner,
  isWhatsAppChannel,
} from "@/lib/integrations/whatsapp/send-outbound";
import { WhatsAppSendError } from "@/lib/integrations/whatsapp-cloud";
import { getOwnerAiSettingsForId } from "@/lib/ai/owner-settings";
import type { createServiceRoleClient } from "@/lib/supabase/server";
import { createServiceRoleClient as createAdmin } from "@/lib/supabase/server";
import {
  loadConversationForOwner,
  getIntegrationsForOwner,
} from "@/lib/db/owner-queries";
import {
  createAiLogForOwner,
  createNotificationForOwner,
  insertMessageForOwner,
  updateConversationForOwner,
  updateGuestContextForOwner,
} from "@/lib/db/owner-mutations";
import { requireAuth } from "@/lib/auth/session";
import type { IntentCategory } from "@/types";
import type { AiDecision } from "@/lib/supabase/types";

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

export async function runAiPipeline(input: {
  admin: ReturnType<typeof createServiceRoleClient>;
  ownerId: string;
  conversationId: string;
  messageId: string;
}): Promise<ProcessMessageResult> {
  const { admin, ownerId, conversationId, messageId } = input;

  const { data: message, error: msgErr } = await admin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (msgErr || !message) throw new Error("Mensaje no encontrado");
  if (message.conversation_id !== conversationId) {
    throw new Error("El mensaje no pertenece a esta conversación");
  }
  if (message.sender_type !== "guest") {
    throw new Error("Solo se procesan mensajes de huéspedes");
  }

  const loaded = await loadConversationForOwner(admin, ownerId, conversationId);
  if (!loaded) throw new Error("Conversación no encontrada");

  const {
    conversation,
    guestContext: storedContext,
    property,
    guest,
    knowledge,
    messages,
    reservation,
    unit,
  } = loaded;

  const ownerSettings = await getOwnerAiSettingsForId(admin, ownerId);

  const regexContext = buildContextFromMessages(
    messages.filter((m) => m.sender === "guest").map((m) => m.content),
    storedContext
  );
  let guestContext = mergeGuestContext(
    regexContext,
    extractEntitiesFromText(message.body)
  );

  const escalationHint = detectEscalationSignals(message.body);
  const complaintHint = detectComplaintSignals(message.body);
  const commercialHint = detectCommercialProposal(message.body);

  let intentCategory = (conversation.intentCategory ?? "otro") as IntentCategory;

  if (ownerSettings.ai_auto_classification !== false) {
    intentCategory = await applyIntentToConversation(
      conversationId,
      {
        messageText: message.body,
        hasReservation: Boolean(conversation.reservationId),
        channel: conversation.platform.toLowerCase(),
      },
      admin
    );
  }

  const allowGreeting = shouldUseGreeting(messages);
  const systemPrompt = `${AI_SYSTEM_PROMPT}\n${getCategoryPromptSuffix(intentCategory)}`;

  const userPrompt = buildAiUserPrompt({
    guestMessage: message.body,
    guest: guest ? { fullName: guest.fullName } : null,
    guestNameFallback: conversation.guestName,
    property,
    knowledge,
    reservation,
    unit,
    recentMessages: messages,
    guestContext,
    platform: conversation.platform,
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
    await createAiLogForOwner(admin, ownerId, {
      conversationId,
      messageId,
      generatedResponse: "",
      usedKnowledge: [],
      missingInformation: [],
      aiDecision: "requiere_revision",
      autoSent: false,
    }).catch(() => undefined);

    await updateConversationForOwner(admin, ownerId, conversationId, {
      ai_status: "needs_review",
      priority: "revisar",
      labels: ["Requiere revisión"],
      unread: true,
    });

    throw new Error(
      msg.includes("API key") ? "OPENAI_API_KEY inválida o no configurada" : `OpenAI: ${msg}`
    );
  }

  if (parsed.extractedFacts) {
    guestContext = mergeGuestContext(guestContext, parsed.extractedFacts);
  }
  await updateGuestContextForOwner(admin, ownerId, conversationId, guestContext);

  parsed = {
    ...parsed,
    generatedResponse: polishGeneratedResponse(parsed.generatedResponse, {
      guestName: conversation.guestName,
      allowGreeting,
    }),
  };

  if (escalationHint && parsed.decision !== "escalar_dueno") {
    parsed = {
      ...parsed,
      decision: "escalar_dueno",
      reason: `${parsed.reason} Señales de urgencia detectadas.`,
      confidence: Math.max(parsed.confidence, 0.85),
    };
  }

  if (commercialHint && parsed.decision === "auto_responder") {
    parsed = {
      ...parsed,
      decision: "requiere_revision",
      reason: `${parsed.reason} Propuesta comercial — revisión del dueño.`,
    };
  }

  const integrations = await getIntegrationsForOwner(admin, ownerId);
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
      const delivered = await deliverWhatsAppForOwner({
        admin,
        ownerId,
        conversationId,
        text: parsed.generatedResponse,
        senderType: "ai",
        senderName: "InnIA",
        aiGenerated: true,
        aiAutoSent: true,
      });
      autoSent = true;
      sentMessageId = delivered.messageId;
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
    const sent = await insertMessageForOwner(admin, {
      conversationId,
      senderType: "ai",
      body: parsed.generatedResponse,
      senderName: "InnIA",
      aiGenerated: true,
      aiAutoSent: true,
    });
    autoSent = true;
    sentMessageId = sent.id;
  }

  const log = await createAiLogForOwner(admin, ownerId, {
    conversationId,
    messageId,
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
        : ["Requiere revisión"];

  const effectiveAiStatus = autoSent
    ? "auto_sent"
    : autoSendFailed || (wantsAutoSend && !aiAutoReplyEnabled)
      ? "needs_review"
      : aiStatusMap[decision];

  await updateConversationForOwner(admin, ownerId, conversationId, {
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
    last_message_preview: autoSent
      ? parsed.generatedResponse.slice(0, 120)
      : undefined,
    last_message_at: autoSent ? new Date().toISOString() : undefined,
  });

  if (autoSent) {
    await createNotificationForOwner(admin, ownerId, {
      type: "ia",
      title: "IA respondió automáticamente",
      body: `Respuesta enviada a ${conversation.guestName}.`,
      relatedEntityType: "conversation",
      relatedEntityId: conversationId,
    });
  } else if (autoSendFailed) {
    await createNotificationForOwner(admin, ownerId, {
      type: "ia",
      title: "Error al enviar respuesta automática",
      body: autoSendError ?? "No se pudo enviar por WhatsApp.",
      relatedEntityType: "conversation",
      relatedEntityId: conversationId,
    });
  } else if (!autoSent && parsed.generatedResponse.trim()) {
    await createNotificationForOwner(admin, ownerId, {
      type: "ia",
      title: "Respuesta sugerida lista",
      body: `Revisá la conversación con ${conversation.guestName}.`,
      relatedEntityType: "conversation",
      relatedEntityId: conversationId,
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

/** Called from WhatsApp webhook after guest message is saved */
export async function autoProcessIncomingGuestMessage(input: {
  ownerId: string;
  conversationId: string;
  messageId: string;
  admin?: ReturnType<typeof createServiceRoleClient>;
}): Promise<void> {
  const admin = input.admin ?? createAdmin();
  const settings = await getOwnerAiSettingsForId(admin, input.ownerId);
  if (settings.ai_auto_process_enabled === false) return;
  if (settings.ai_auto_reply_enabled === false && settings.ai_auto_classification === false) {
    return;
  }

  try {
    await runAiPipeline({
      admin,
      ownerId: input.ownerId,
      conversationId: input.conversationId,
      messageId: input.messageId,
    });
    console.info("[ai:auto-process]", {
      conversationId: input.conversationId,
      messageId: input.messageId,
      ok: true,
    });
  } catch (e) {
    console.error("[ai:auto-process]", {
      conversationId: input.conversationId,
      messageId: input.messageId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/** API route: authenticated manual / reprocess */
export async function processMessageWithAi(input: {
  conversationId: string;
  messageId: string;
}): Promise<ProcessMessageResult> {
  const { user } = await requireAuth();
  const admin = createAdmin();
  return runAiPipeline({
    admin,
    ownerId: user.id,
    conversationId: input.conversationId,
    messageId: input.messageId,
  });
}
