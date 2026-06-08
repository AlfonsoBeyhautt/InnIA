"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Check,
  ExternalLink,
  MoreHorizontal,
  Paperclip,
  Send,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useInbox } from "@/context/inbox-context";
import { useProperty } from "@/context/property-context";
import { INTENT_CATEGORY_LABELS } from "@/lib/conversations/intent-classifier";
import type { IntentCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MessageThread() {
  const {
    selected,
    sendOwnerMessage,
    getAnalysis,
    reclassifyIntent,
  } = useInbox();
  const { resolvePropertyName } = useProperty();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft("");
  }, [selected?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selected?.messages]);

  if (!selected) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-sm">Seleccioná una conversación para ver los mensajes</p>
      </div>
    );
  }

  const analysis = getAnalysis(selected.id);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendOwnerMessage(selected.id, text);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="sticky top-0 z-[1] shrink-0 border-b border-border/60 bg-white/95 px-5 py-4 backdrop-blur-sm max-lg:px-3 max-lg:py-2 lg:static">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground lg:text-lg">
                {selected.guestName}
              </h2>
              <Badge variant="success" className="text-[10px]">
                {INTENT_CATEGORY_LABELS[selected.intentCategory]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {resolvePropertyName(selected.propertyId)}
              </span>
              <select
                className="sr-only"
                value={selected.intentCategory}
                onChange={(e) =>
                  void reclassifyIntent(
                    selected.id,
                    e.target.value as IntentCategory
                  )
                }
                title="Reclasificar conversación"
              >
                {(Object.keys(INTENT_CATEGORY_LABELS) as IntentCategory[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {INTENT_CATEGORY_LABELS[key]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-foreground">
              <span className="inline-flex items-center gap-2">
                <PlatformBadge platform={selected.platform} />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Reserva: 4 - 6 jun.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                2 huéspedes
              </span>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Button variant="outline" size="sm" className="h-9 rounded-xl bg-white text-xs" asChild>
              <Link href="/app/reservas">
                Ver reserva
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fbfaf7] px-5 py-5 max-lg:p-3 lg:px-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/55">
                Hoy
              </span>
            </div>
            {selected.messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className={cn(
                  "flex gap-2 max-lg:gap-2 lg:gap-3",
                  msg.sender === "guest" ? "justify-start" : "justify-end"
                )}
              >
                {msg.sender === "guest" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-[#f3f0e7] text-[11px] font-semibold text-muted-foreground">
                    {selected.guestName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[min(92%,520px)] rounded-2xl px-4 py-3 text-[13px] shadow-sm max-lg:max-w-[88%] lg:text-sm",
                    msg.sender === "guest" && "border border-border/70 bg-white",
                    msg.sender === "ai" && "border border-olive/15 bg-[#eff1e8]",
                    msg.sender === "owner" && "bg-olive text-cream"
                  )}
                >
                  {msg.sender === "ai" && (
                    <span className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-olive">
                      <Bot className="h-3 w-3" />
                      Respondido por IA
                      {analysis?.autoSentAt && msg === selected.messages[selected.messages.length - 1] && (
                        <span className="font-normal normal-case text-muted-foreground">
                          · {analysis.autoSentAt}
                        </span>
                      )}
                    </span>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        "text-[10px]",
                        msg.sender === "owner" ? "text-white/70" : "text-slate-400"
                      )}
                    >
                      {msg.timestamp}
                    </p>
                    {msg.sender === "ai" && <Check className="h-3.5 w-3.5 text-olive" />}
                  </div>
                </div>
                {msg.sender !== "guest" && (
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground shadow-sm"
                    aria-label="Opciones de mensaje"
                  >
                    {msg.sender === "ai" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="ci-safe-bottom sticky bottom-0 z-[1] shrink-0 border-t border-border/60 bg-white px-5 py-4 max-lg:p-3 lg:px-10">
        <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-[0_10px_30px_-26px_rgba(46,58,42,0.4)]">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribir un mensaje..."
            className="min-h-[54px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 max-lg:text-base"
            rows={2}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <button type="button" className="inline-flex items-center gap-1.5 font-medium">
                <Zap className="h-4 w-4" />
                Respuesta rápida
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                className="ci-touch-target h-9 w-9 shrink-0 rounded-xl bg-olive text-cream hover:bg-olive/90"
                onClick={handleSend}
                disabled={!draft.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
