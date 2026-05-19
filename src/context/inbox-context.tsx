"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { conversations as mockConversations } from "@/data/mock";
import {
  analyzeGuestMessage,
  formatTimestamp,
} from "@/lib/inbox-ai";
import { apiPost } from "@/lib/hooks/use-api";
import { filterByProperty } from "@/lib/utils";
import { useProperty } from "@/context/property-context";
import type { Conversation, Message, Urgency } from "@/types";
import type { AiAnalysis, AiResponseStatus } from "@/types/inbox-ai";
import { labelFromAiStatus } from "@/types/inbox-ai";

export type InboxFilter = "all" | "unread" | "review";

type InboxContextValue = {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: Conversation | null;
  filter: InboxFilter;
  setFilter: (f: InboxFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  aiPanelOpen: boolean;
  setAiPanelOpen: (v: boolean) => void;
  aiPanelExpanded: boolean;
  setAiPanelExpanded: (v: boolean) => void;
  getAnalysis: (id: string) => AiAnalysis | null;
  sendOwnerMessage: (conversationId: string, content: string) => Promise<void>;
  sendAiReply: (conversationId: string, options?: { force?: boolean }) => void;
  runAutoReplyIfPossible: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  mobileShowList: boolean;
  setMobileShowList: (v: boolean) => void;
  refetch: () => Promise<void>;
};

const InboxContext = createContext<InboxContextValue | null>(null);

function mergeLabels(conversation: Conversation, analysis: AiAnalysis | null): Conversation["labels"] {
  const base: Conversation["labels"] = conversation.labels.filter(
    (l) => l !== "Respondido por IA" && l !== "Requiere revisión"
  ) as Conversation["labels"];
  const aiLabel = analysis ? labelFromAiStatus(analysis.status) : null;
  if (aiLabel && !base.includes(aiLabel)) return [...base, aiLabel];
  return base;
}

function urgencyFromAnalysis(analysis: AiAnalysis | null, prev: Urgency): Urgency {
  if (!analysis) return prev;
  if (analysis.status === "insufficient_info" || analysis.status === "needs_review")
    return "revisar";
  if (analysis.detectedIntent === "cerradura") return "urgente";
  return prev === "urgente" ? "urgente" : "normal";
}

function decisionToStatus(decision: string): AiResponseStatus {
  switch (decision) {
    case "auto_responder":
      return "auto_sent";
    case "informacion_insuficiente":
      return "insufficient_info";
    case "escalar_dueno":
    case "requiere_revision":
    default:
      return "needs_review";
  }
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const { selectedProperty } = useProperty();
  const [items, setItems] = useState<Conversation[]>(mockConversations);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, AiAnalysis>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiPanelExpanded, setAiPanelExpanded] = useState(false);
  const [mobileShowList, setMobileShowList] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = (await res.json()) as Conversation[];
        setItems(data);
        if (!selectedId && data[0]) setSelectedId(data[0].id);
      }
    } catch {
      setItems(JSON.parse(JSON.stringify(mockConversations)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  const propertyFiltered = useMemo(
    () => filterByProperty(items, selectedProperty),
    [items, selectedProperty]
  );

  const conversations = useMemo(() => {
    return propertyFiltered.filter((c) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const match =
          c.guestName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filter === "unread") return c.unread;
      if (filter === "review")
        return (
          c.urgency !== "normal" ||
          c.labels.includes("Requiere revisión") ||
          analyses[c.id]?.status === "insufficient_info" ||
          analyses[c.id]?.status === "needs_review"
        );
      return true;
    });
  }, [propertyFiltered, search, filter, analyses]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null,
    [conversations, selectedId]
  );

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      setItems((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    },
    []
  );

  const getAnalysis = useCallback((id: string) => analyses[id] ?? null, [analyses]);

  const setAnalysis = useCallback((id: string, analysis: AiAnalysis) => {
    setAnalyses((prev) => ({ ...prev, [id]: analysis }));
    updateConversation(id, (c) => ({
      ...c,
      labels: mergeLabels(c, analysis),
      urgency: urgencyFromAnalysis(analysis, c.urgency),
      unread: analysis.status === "needs_review" || analysis.status === "insufficient_info",
    }));
  }, [updateConversation]);

  const runAutoReplyIfPossible = useCallback(
    async (conversationId: string) => {
      const conv = items.find((c) => c.id === conversationId);
      if (!conv) return;

      const last = conv.messages[conv.messages.length - 1];
      if (last?.sender !== "guest") return;

      try {
        const result = await apiPost<{
          decision: string;
          response: string;
          usedKnowledge: string[];
          missingInformation: string[];
          autoSent: boolean;
        }>("/api/ai/process-message", {
          conversationId,
          messageId: last.id,
        });

        const status = decisionToStatus(result.decision);
        const analysis: AiAnalysis = {
          status,
          suggestedResponse: result.response,
          sourcesUsed: result.usedKnowledge,
          missingTopics: result.missingInformation,
          reason:
            status === "auto_sent"
              ? "La IA respondió automáticamente con la información disponible."
              : result.missingInformation.join(" ") || "Requiere revisión humana.",
          canAutoSend: result.autoSent,
          detectedIntent: "general",
          autoSentAt: result.autoSent ? formatTimestamp() : undefined,
        };
        setAnalysis(conversationId, analysis);
        if (result.autoSent) await refetch();
      } catch {
        const analysis = analyzeGuestMessage(conv);
        setAnalysis(conversationId, analysis);
        if (analysis.canAutoSend && analysis.status === "auto_sent") {
          const aiMessage: Message = {
            id: `m-${Date.now()}`,
            conversationId,
            sender: "ai",
            content: analysis.suggestedResponse,
            timestamp: formatTimestamp(),
          };
          updateConversation(conversationId, (c) => ({
            ...c,
            messages: [...c.messages, aiMessage],
            lastMessage: analysis.suggestedResponse.slice(0, 80),
            lastMessageAt: "Ahora",
            unread: false,
          }));
        }
      }
    },
    [items, setAnalysis, updateConversation, refetch]
  );

  const sendOwnerMessage = useCallback(
    async (conversationId: string, content: string) => {
      const text = content.trim();
      if (!text) return;

      try {
        const res = await apiPost<{ conversation: Conversation }>(
          `/api/conversations/${conversationId}/messages`,
          { body: text, senderType: "owner" }
        );
        if (res.conversation) {
          setItems((prev) =>
            prev.map((c) => (c.id === conversationId ? res.conversation : c))
          );
        }
      } catch {
        const msg: Message = {
          id: `m-${Date.now()}`,
          conversationId,
          sender: "owner",
          content: text,
          timestamp: formatTimestamp(),
        };
        updateConversation(conversationId, (c) => ({
          ...c,
          messages: [...c.messages, msg],
          lastMessage: text,
          lastMessageAt: "Ahora",
          unread: false,
        }));
      }
    },
    [updateConversation]
  );

  const sendAiReply = useCallback(
    (conversationId: string, options?: { force?: boolean }) => {
      const conv = items.find((c) => c.id === conversationId);
      if (!conv) return;
      let analysis = analyses[conversationId] ?? analyzeGuestMessage(conv);
      if (!analysis.suggestedResponse) return;
      if (!options?.force && !analysis.canAutoSend && analysis.status === "insufficient_info")
        return;

      const aiMessage: Message = {
        id: `m-${Date.now()}`,
        conversationId,
        sender: "ai",
        content: analysis.suggestedResponse,
        timestamp: formatTimestamp(),
      };

      analysis = {
        ...analysis,
        status: options?.force ? "needs_review" : "auto_sent",
        autoSentAt: formatTimestamp(),
      };

      updateConversation(conversationId, (c) => ({
        ...c,
        messages: [...c.messages, aiMessage],
        lastMessage: analysis.suggestedResponse.slice(0, 80),
        lastMessageAt: "Ahora",
        unread: false,
        labels: mergeLabels(c, { ...analysis, status: "auto_sent" }),
        urgency: "normal",
      }));
      setAnalysis(conversationId, analysis);
    },
    [items, analyses, setAnalysis, updateConversation]
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      updateConversation(conversationId, (c) => ({ ...c, unread: false }));
      fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: false }),
      }).catch(() => undefined);
    },
    [updateConversation]
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) {
        markAsRead(id);
        setMobileShowList(false);
        void runAutoReplyIfPossible(id);
      }
    },
    [markAsRead, runAutoReplyIfPossible]
  );

  const value: InboxContextValue = {
    conversations,
    loading,
    selectedId: selected?.id ?? null,
    setSelectedId: handleSelect,
    selected,
    filter,
    setFilter,
    search,
    setSearch,
    aiPanelOpen,
    setAiPanelOpen,
    aiPanelExpanded,
    setAiPanelExpanded,
    getAnalysis,
    sendOwnerMessage,
    sendAiReply,
    runAutoReplyIfPossible,
    markAsRead,
    mobileShowList,
    setMobileShowList,
    refetch,
  };

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within InboxProvider");
  return ctx;
}
