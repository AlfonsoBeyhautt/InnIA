"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox, type InboxFilter } from "@/context/inbox-context";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const filters: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Sin leer" },
  { id: "review", label: "Revisar" },
];

export function ConversationList() {
  const {
    conversations,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    search,
    setSearch,
    getAnalysis,
  } = useInbox();

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="shrink-0 space-y-2.5 border-b border-border/70 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="h-9 border-border/80 bg-sand/50 pl-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === f.id
                  ? "bg-olive text-cream"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No hay conversaciones</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {conversations.map((c) => {
              const active = selectedId === c.id;
              const analysis = getAnalysis(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full gap-2.5 px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-primary/12 ring-1 ring-inset ring-primary/20"
                        : "hover:bg-sand/60",
                      c.urgency === "urgente" && !active && "border-l-2 border-l-terracotta"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{getInitials(c.guestName)}</AvatarFallback>
                      </Avatar>
                      {c.unread && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("truncate text-sm font-medium", active && "text-primary")}>
                          {c.guestName}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {c.lastMessageAt}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {c.lastMessage}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <PlatformBadge platform={c.platform} />
                        {analysis?.status === "auto_sent" && (
                          <Badge variant="success" className="text-[9px]">
                            IA automática
                          </Badge>
                        )}
                        {analysis?.status === "insufficient_info" && (
                          <Badge variant="warning" className="text-[9px]">
                            Info insuficiente
                          </Badge>
                        )}
                        {c.urgency === "urgente" && (
                          <Badge variant="danger" className="text-[9px]">
                            Urgente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}