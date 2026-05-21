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
import { formatTimestamp } from "@/lib/inbox-ai";
import { apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { DEMO_PROPERTY_IDS } from "@/lib/demo/constants";
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
  processWithAi: (conversationId: string) => Promise<void>;
  aiProcessingId: string | null;
  markAsRead: (conversationId: string) => void;
  markResolved: (conversationId: string) => Promise<void>;
  createTaskFromConversation: (conversationId: string) => Promise<void>;
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

type AiProcessApiResult = {
  decision: string;
  confidence: number;
  generatedResponse: string;
  usedKnowledge: string[];
  missingInformation: string[];
  reason: string;
  autoSent: boolean;
};

export function InboxProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { selectedProperty } = useProperty();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, AiAnalysis>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiPanelExpanded, setAiPanelExpanded] = useState(false);
  const [mobileShowList, setMobileShowList] = useState(true);
  const [aiProcessingId, setAiProcessingId] = useState<string | null>(null);

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
      setItems([]);
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

  useEffect(() => {
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => void refetch(), 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
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

  const processWithAi = useCallback(
    async (conversationId: string) => {
      const conv = items.find((c) => c.id === conversationId);
      if (!conv) return;

      const lastGuest = [...conv.messages].reverse().find((m) => m.sender === "guest");
      if (!lastGuest) {
        toast("No hay un mensaje del huésped para procesar.", "error");
        return;
      }

      setAiProcessingId(conversationId);
      try {
        const result = await apiPost<AiProcessApiResult>("/api/ai/process-message", {
          conversationId,
          messageId: lastGuest.id,
        });

        const status = decisionToStatus(result.decision);
        const analysis: AiAnalysis = {
          status,
          suggestedResponse: result.generatedResponse,
          sourcesUsed: result.usedKnowledge,
          missingTopics: result.missingInformation,
          reason: result.reason,
          confidence: result.confidence,
          canAutoSend: result.decision === "auto_responder",
          detectedIntent: result.decision === "escalar_dueno" ? "urgencia" : "general",
          autoSentAt: result.autoSent ? formatTimestamp() : undefined,
          propertySlug: conv.propertyId,
        };
        setAnalysis(conversationId, analysis);
        await refetch();

        if (result.autoSent) {
          toast("Respuesta enviada automáticamente por IA.", "success");
        } else if (result.decision === "informacion_insuficiente") {
          toast("Información insuficiente. Completá la base de conocimiento.", "info");
        } else if (result.decision === "escalar_dueno") {
          toast("Caso escalado — requiere tu atención.", "error");
        } else {
          toast("Respuesta sugerida lista para revisión.", "info");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo procesar con IA";
        toast(msg, "error");
      } finally {
        setAiProcessingId(null);
      }
    },
    [items, setAnalysis, refetch, toast]
  );

  const sendOwnerMessage = useCallback(
    async (conversationId: string, content: string) => {
      const text = content.trim();
      if (!text) return;

      const conv = items.find((c) => c.id === conversationId);

      try {
        let res: { conversation: Conversation };
        if (conv?.platform === "WhatsApp") {
          res = await apiPost<{ conversation: Conversation }>(
            "/api/integrations/whatsapp/send",
            { conversationId, text }
          );
        } else if (conv?.platform === "Email") {
          res = await apiPost<{ conversation: Conversation }>(
            "/api/integrations/email/send",
            { conversationId, text }
          );
        } else {
          res = await apiPost<{ conversation: Conversation }>(
            `/api/conversations/${conversationId}/messages`,
            { body: text, senderType: "owner" }
          );
        }
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
    async (conversationId: string) => {
      const analysis = analyses[conversationId];
      if (!analysis?.suggestedResponse.trim()) return;

      try {
        const res = await apiPost<{ conversation: Conversation }>(
          `/api/conversations/${conversationId}/messages`,
          {
            body: analysis.suggestedResponse,
            senderType: "ai",
            senderName: "InnIA",
            aiGenerated: true,
            aiAutoSent: false,
          }
        );
        if (res.conversation) {
          setItems((prev) =>
            prev.map((c) => (c.id === conversationId ? res.conversation : c))
          );
        }
        setAnalysis(conversationId, {
          ...analysis,
          status: "auto_sent",
          autoSentAt: formatTimestamp(),
        });
        toast("Respuesta enviada al huésped.", "success");
      } catch {
        toast("No se pudo enviar la respuesta.", "error");
      }
    },
    [analyses, setAnalysis, toast]
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

  const markResolved = useCallback(
    async (conversationId: string) => {
      updateConversation(conversationId, (c) => ({
        ...c,
        unread: false,
        urgency: "normal",
        labels: c.labels.filter(
          (l) => l !== "Requiere revisión" && l !== "Urgente"
        ) as Conversation["labels"],
      }));
      try {
        await fetch(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unread: false, priority: "normal" }),
        });
      } catch {
        /* local state already updated */
      }
    },
    [updateConversation]
  );

  const createTaskFromConversation = useCallback(
    async (conversationId: string) => {
      const conv = items.find((c) => c.id === conversationId);
      if (!conv) return;
      await apiPost("/api/tasks", {
        propertyDbId:
          conv.propertyDbId ??
          DEMO_PROPERTY_IDS[conv.propertyId as keyof typeof DEMO_PROPERTY_IDS],
        title: `Seguimiento: ${conv.guestName}`,
        type: "mantenimiento",
        description: conv.lastMessage,
        status: "Pendiente",
      });
    },
    [items]
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) {
        markAsRead(id);
        setMobileShowList(false);
      }
    },
    [markAsRead]
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
    processWithAi,
    aiProcessingId,
    markAsRead,
    markResolved,
    createTaskFromConversation,
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
