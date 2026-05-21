import {
  AI_DECISION_THRESHOLDS,
} from "@/lib/ai/config";
import type { AiDecision } from "@/lib/supabase/types";

const VALID_DECISIONS: AiDecision[] = [
  "auto_responder",
  "requiere_revision",
  "informacion_insuficiente",
  "escalar_dueno",
];

export type ParsedAiResponse = {
  decision: AiDecision;
  confidence: number;
  generatedResponse: string;
  usedKnowledge: string[];
  missingInformation: string[];
  reason: string;
};

function clampConfidence(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(1, Math.max(0, v));
}

function normalizeDecision(raw: unknown): AiDecision {
  if (typeof raw === "string" && VALID_DECISIONS.includes(raw as AiDecision)) {
    return raw as AiDecision;
  }
  return "requiere_revision";
}

/** Owner/property knowledge gaps — NOT guest-provided details like dates */
const OWNER_KNOWLEDGE_KEYWORDS = [
  "wifi",
  "estacionamiento",
  "parking",
  "mascota",
  "check-in",
  "check-out",
  "check in",
  "check out",
  "cerradura",
  "reglas",
  "política",
  "politica",
  "conocimiento",
  "base de",
  "propiedad",
  "instrucciones",
  "emergencia",
  "house rules",
  "normas",
];

function hasOwnerKnowledgeGap(missing: string[]): boolean {
  if (missing.length === 0) return false;
  return missing.some((item) => {
    const t = item.toLowerCase();
    return OWNER_KNOWLEDGE_KEYWORDS.some((k) => t.includes(k));
  });
}

/** Guest can provide missing details (dates, party size) — OK to auto-ask */
function canAutoAskGuestForDetails(missing: string[]): boolean {
  if (missing.length === 0) return true;
  return !hasOwnerKnowledgeGap(missing);
}

/** Parse OpenAI JSON and apply server-side decision safeguards */
export function parseAndApplyAiRules(
  rawJson: string,
  options?: { escalationHint?: boolean; complaintHint?: boolean }
): ParsedAiResponse {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawJson) as Record<string, unknown>;
  } catch {
    return {
      decision: "requiere_revision",
      confidence: 0.4,
      generatedResponse:
        "Gracias por tu mensaje. Nuestro equipo lo revisará y te responderá a la brevedad.",
      usedKnowledge: [],
      missingInformation: [],
      reason: "No se pudo interpretar la respuesta del modelo.",
    };
  }

  let decision = normalizeDecision(parsed.decision);
  let confidence = clampConfidence(parsed.confidence);
  const generatedResponse =
    typeof parsed.generatedResponse === "string"
      ? parsed.generatedResponse
      : typeof parsed.response === "string"
        ? parsed.response
        : "";
  const usedKnowledge = Array.isArray(parsed.usedKnowledge)
    ? (parsed.usedKnowledge as string[])
    : Array.isArray(parsed.used_knowledge)
      ? (parsed.used_knowledge as string[])
      : [];
  const missingInformation = Array.isArray(parsed.missingInformation)
    ? (parsed.missingInformation as string[])
    : Array.isArray(parsed.missing_information)
      ? (parsed.missing_information as string[])
      : [];
  let reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : "Decisión del modelo de IA.";

  if (options?.escalationHint || options?.complaintHint) {
    if (decision === "auto_responder") {
      decision = "escalar_dueno";
      reason = "Se detectaron señales de urgencia, queja o situación sensible.";
      confidence = Math.max(confidence, 0.85);
    }
  }

  if (
    decision === "informacion_insuficiente" &&
    generatedResponse.trim() &&
    canAutoAskGuestForDetails(missingInformation)
  ) {
    decision = "auto_responder";
    reason +=
      " El huésped puede aportar más detalles; la respuesta solicita información de forma natural.";
    confidence = Math.max(confidence, AI_DECISION_THRESHOLDS.autoRespondMinConfidence);
  }

  if (decision === "auto_responder") {
    if (confidence < AI_DECISION_THRESHOLDS.autoRespondMinConfidence) {
      decision = "requiere_revision";
      reason += " Confianza por debajo del umbral para envío automático.";
    } else if (!generatedResponse.trim()) {
      decision = "informacion_insuficiente";
      reason += " Sin texto de respuesta seguro para envío automático.";
    } else if (hasOwnerKnowledgeGap(missingInformation)) {
      decision = "informacion_insuficiente";
      reason += " Falta información del dueño o de la propiedad en la base de conocimiento.";
    }
  }

  if (
    decision === "requiere_revision" &&
    confidence < AI_DECISION_THRESHOLDS.reviewBelowConfidence &&
    hasOwnerKnowledgeGap(missingInformation)
  ) {
    decision = "informacion_insuficiente";
  }

  return {
    decision,
    confidence,
    generatedResponse: generatedResponse.trim(),
    usedKnowledge,
    missingInformation,
    reason,
  };
}

/** Urgent / safety / complaint signals */
export function detectEscalationSignals(message: string): boolean {
  const t = message.toLowerCase();
  const patterns = [
    /emergenc/i,
    /urgente/i,
    /polic[ií]a/,
    /ambulanc/i,
    /hospital/i,
    /incendio/,
    /robo/,
    /amenaza/,
    /agresi[oó]n/,
    /violencia/,
    /sin\s+(agua|luz|gas)/,
    /fuga\s+de\s+gas/,
    /daño\s+grave/,
    /rompieron/,
    /no\s+puedo\s+entrar/,
    /cerradura\s+(rota|no\s+funciona)/,
    /estafa/,
    /peligro/,
    /reembolso/i,
    /devoluci[oó]n/,
    /cancelar.*reserva/i,
    /disputa/i,
  ];
  return patterns.some((p) => p.test(t));
}

export function detectComplaintSignals(message: string): boolean {
  const t = message.toLowerCase();
  const patterns = [
    /queja/i,
    /reclamo/i,
    /p[eé]simo/i,
    /horrible/i,
    /asqueroso/i,
    /sucio/i,
    /mentira/i,
    /estafa/i,
    /nunca\s+m[aá]s/i,
    /indignad/i,
    /decepcion/i,
    /mal[ií]simo/i,
  ];
  return patterns.some((p) => p.test(t));
}

export function detectCommercialProposal(message: string): boolean {
  const t = message.toLowerCase();
  return /propuesta|colaboraci[oó]n|publicidad|marketing|inversi[oó]n|socio\s+comercial/i.test(
    t
  );
}
