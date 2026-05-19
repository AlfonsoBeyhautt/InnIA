import type { ConversationLabel } from "@/types";

export type AiResponseStatus = "auto_sent" | "needs_review" | "insufficient_info" | "idle";

export interface AiAnalysis {
  status: AiResponseStatus;
  suggestedResponse: string;
  sourcesUsed: string[];
  missingTopics: string[];
  reason: string;
  canAutoSend: boolean;
  detectedIntent: string;
  autoSentAt?: string;
}

export type InboxConversationState = {
  aiAnalysis: AiAnalysis | null;
  autoReplyEnabled: boolean;
};

export function labelFromAiStatus(
  status: AiResponseStatus
): ConversationLabel | null {
  switch (status) {
    case "auto_sent":
      return "Respondido por IA";
    case "needs_review":
      return "Requiere revisión";
    case "insufficient_info":
      return "Requiere revisión";
    default:
      return null;
  }
}
