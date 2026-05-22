"use client";

import { useMemo } from "react";
import { ArrowLeft, Inbox, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox } from "@/context/inbox-context";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { AiCopilotPanel } from "@/components/inbox/ai-copilot-panel";

export function InboxWorkspace() {
  const {
    conversations,
    mobileShowList,
    setMobileShowList,
    aiPanelOpen,
    setAiPanelOpen,
  } = useInbox();

  const pendingCount = useMemo(
    () => conversations.filter((c) => c.unread || c.urgency !== "normal").length,
    [conversations]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-muted/60",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20",
        "max-lg:top-[calc(3rem+env(safe-area-inset-top,0px))]",
        "lg:relative lg:inset-auto lg:z-auto lg:h-[calc(100dvh-4rem)]"
      )}
    >
      <header className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-white/95 backdrop-blur-sm max-lg:px-3 max-lg:py-2 lg:static lg:px-4 lg:py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {!mobileShowList && (
              <button
                type="button"
                onClick={() => setMobileShowList(true)}
                className="ci-touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground active:bg-sand/60 lg:hidden"
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white lg:h-8">
              <Inbox className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground lg:text-lg">
                Centro de mensajes
              </h1>
              <p className="hidden text-xs text-muted-foreground lg:block">
                Comunicación unificada con respuesta automática por IA
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {pendingCount > 0 && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 lg:px-2 lg:text-[11px]">
                {pendingCount}
              </span>
            )}
            <button
              type="button"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={cn(
                "ci-touch-target flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors lg:hidden",
                aiPanelOpen
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-primary/25 bg-primary/5 text-primary"
              )}
              aria-label="Asistente IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
              IA
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r border-border/70 bg-white",
            "max-lg:absolute max-lg:inset-0 max-lg:z-[1]",
            !mobileShowList && "max-lg:hidden",
            "lg:relative lg:flex lg:w-[min(100%,280px)] xl:w-[300px]"
          )}
        >
          <ConversationList />
        </aside>

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-white",
            "max-lg:absolute max-lg:inset-0 max-lg:z-[2]",
            mobileShowList && "max-lg:hidden",
            "lg:relative lg:flex"
          )}
        >
          <MessageThread />
        </main>

        {/* Desktop: panel columna (sin cambios) */}
        <div className="hidden lg:contents">
          <AiCopilotPanel />
        </div>

        {/* Mobile/Tablet: sheet inferior IA */}
        {aiPanelOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar asistente"
              className="fixed inset-0 z-[25] bg-black/30 lg:hidden"
              onClick={() => setAiPanelOpen(false)}
            />
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-[26] flex max-h-[min(72dvh,520px)] flex-col overflow-hidden",
                "rounded-t-2xl border border-border/70 bg-white shadow-2xl lg:hidden"
              )}
            >
              <div className="flex shrink-0 items-center justify-center border-b border-border/50 py-2">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <button
                type="button"
                onClick={() => setAiPanelOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1 overflow-hidden">
                <AiCopilotPanel variant="sheet" onClose={() => setAiPanelOpen(false)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
