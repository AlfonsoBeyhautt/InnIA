"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, ClipboardList, Send, User } from "lucide-react";
import { useInbox } from "@/context/inbox-context";
import { useToast } from "@/context/toast-context";
import { useProperty } from "@/context/property-context";
import { INTENT_CATEGORY_LABELS } from "@/lib/conversations/intent-classifier";
import { IntentCategoryBadge } from "@/components/inbox/intent-category-badge";
import type { IntentCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MessageThread() {
  const { toast } = useToast();
  const {
    selected,
    sendOwnerMessage,
    getAnalysis,
    setMobileShowList,
    markResolved,
    createTaskFromConversation,
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/70 bg-white px-4 py-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setMobileShowList(true)}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:bg-sand/60 lg:hidden"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-foreground">{selected.guestName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <PlatformBadge platform={selected.platform} />
              <IntentCategoryBadge category={selected.intentCategory} />
              <span>{resolvePropertyName(selected.propertyId)}</span>
              {selected.reservationId && (
                <Badge variant="outline" className="text-[9px]">
                  Reserva activa
                </Badge>
              )}
              <select
                className="h-6 rounded border border-border/80 bg-white px-1 text-[10px] text-muted-foreground"
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
              {selected.labels.slice(0, 2).map((label) => (
                <Badge key={label} variant="secondary" className="text-[9px]">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={async () => {
                  try {
                    await markResolved(selected.id);
                    toast("Conversación marcada como resuelta.", "success");
                  } catch {
                    toast("No se pudo actualizar la conversación.", "error");
                  }
                }}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Resuelta
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={async () => {
                  try {
                    await createTaskFromConversation(selected.id);
                    toast("Tarea operativa creada.", "success");
                  } catch {
                    toast("No se pudo crear la tarea.", "error");
                  }
                }}
              >
                <ClipboardList className="mr-1 h-3 w-3" />
                Crear tarea
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" asChild>
                <Link href="/app/crm">Huésped</Link>
              </Button>
              {selected.reservationId && (
                <Button variant="outline" size="sm" className="h-7 text-[11px]" asChild>
                  <Link href="/app/reservas">Reserva</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sand/60/40 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {selected.messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className={cn("flex gap-2.5", msg.sender === "guest" ? "justify-start" : "justify-end")}
              >
                {msg.sender === "guest" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[min(88%,480px)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                    msg.sender === "guest" && "border border-border/70 bg-white",
                    msg.sender === "ai" && "border border-primary/20 bg-primary/8",
                    msg.sender === "owner" && "bg-olive text-cream"
                  )}
                >
                  {msg.sender === "ai" && (
                    <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
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
                  <p
                    className={cn(
                      "mt-1.5 text-[10px]",
                      msg.sender === "owner" ? "text-white/70" : "text-slate-400"
                    )}
                  >
                    {msg.timestamp}
                  </p>
                </div>
                {msg.sender !== "guest" && (
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      msg.sender === "ai"
                        ? "border-primary/20 bg-primary/10"
                        : "border-primary/30 bg-primary/10"
                    )}
                  >
                    {msg.sender === "ai" ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-border/70 bg-white p-3">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje al huésped..."
            className="min-h-[44px] resize-none border-border/70 bg-sand/60 text-sm focus-visible:ring-primary/30"
            rows={2}
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0 self-end"
            onClick={handleSend}
            disabled={!draft.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
