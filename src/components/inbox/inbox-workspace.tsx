"use client";

import { useMemo } from "react";
import { ArrowLeft, Inbox, Sparkles } from "lucide-react";
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
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col bg-muted/60">
      <header className="shrink-0 border-b border-border/70 bg-white px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!mobileShowList && (
              <button
                type="button"
                onClick={() => setMobileShowList(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:bg-sand/60 lg:hidden"
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Inbox className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">Centro de mensajes</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Comunicación unificada con respuesta automática por IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                {pendingCount} por revisar
              </span>
            )}
            {!aiPanelOpen && (
              <button
                type="button"
                onClick={() => setAiPanelOpen(true)}
                className="flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary lg:hidden"
              >
                <Sparkles className="h-3.5 w-3.5" />
                IA
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r border-border/70 bg-white lg:w-[min(100%,280px)] xl:w-[300px]",
            !mobileShowList && "hidden lg:flex"
          )}
        >
          <ConversationList />
        </aside>

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-white",
            mobileShowList && "hidden lg:flex"
          )}
        >
          <MessageThread />
        </main>

        <div className="hidden lg:contents">
          <AiCopilotPanel />
        </div>

        {aiPanelOpen && (
          <div className="fixed inset-x-0 bottom-0 z-30 max-h-[58vh] overflow-hidden rounded-t-xl border border-border/70 bg-white shadow-xl lg:hidden">
            <AiCopilotPanel variant="sheet" onClose={() => setAiPanelOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
