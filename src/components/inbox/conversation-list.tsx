"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox, type InboxFilter } from "@/context/inbox-context";
import { useProperty } from "@/context/property-context";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { IntentCategoryBadge } from "@/components/inbox/intent-category-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InboxEmptyState } from "@/components/inbox/inbox-empty-state";
import type { InboxIntentTab } from "@/types";

const tabs: {
  id: "todos" | "unread" | "huesped_activo" | "comercial";
  label: string;
  intent: InboxIntentTab;
  filter: InboxFilter;
}[] = [
  { id: "todos", label: "Todos", intent: "todos", filter: "all" },
  { id: "unread", label: "No leídos", intent: "todos", filter: "unread" },
  { id: "huesped_activo", label: "Huéspedes", intent: "huesped_activo", filter: "all" },
  { id: "comercial", label: "Comercial", intent: "comercial", filter: "all" },
];

export function ConversationList() {
  const {
    conversations,
    intentCounts,
    selectedId,
    setSelectedId,
    intentTab,
    setIntentTab,
    filter,
    setFilter,
    search,
    setSearch,
    getAnalysis,
  } = useInbox();
  const { resolvePropertyName } = useProperty();
  const unreadCount = conversations.filter((c) => c.unread).length;

  const countFor = (id: (typeof tabs)[number]["id"]) => {
    if (id === "todos") return conversations.length;
    if (id === "unread") return unreadCount;
    return intentCounts[id];
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 space-y-3 border-b border-border/70 p-4 max-lg:p-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="h-10 rounded-xl border-border/70 bg-white pl-8 text-sm shadow-sm max-lg:text-xs"
          />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-white text-muted-foreground shadow-sm transition-colors hover:bg-sand/60"
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const active = intentTab === tab.intent && filter === tab.filter;
            return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setIntentTab(tab.intent);
                setFilter(tab.filter);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-olive text-cream shadow-sm"
                  : "bg-sand/70 text-muted-foreground hover:bg-sand"
              )}
            >
              {tab.label}
              <span className={cn("rounded-full px-1.5 text-[9px]", active ? "bg-cream/20" : "bg-white")}>
                {countFor(tab.id)}
              </span>
            </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <ul className="divide-y divide-border/55">
            {conversations.map((c) => {
              const active = selectedId === c.id;
              const analysis = getAnalysis(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "relative flex w-full gap-3 px-4 py-3 text-left transition-colors",
                      active
                        ? "bg-[#edf2e8]"
                        : "hover:bg-sand/45",
                      c.urgency === "urgente" && !active && "before:absolute before:left-0 before:top-3 before:h-10 before:w-0.5 before:rounded-full before:bg-terracotta"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(c.guestName)}
                        </AvatarFallback>
                      </Avatar>
                      {c.unread && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-olive text-[9px] font-semibold text-cream ring-2 ring-white">
                          1
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            active && "text-primary"
                          )}
                        >
                          {c.guestName}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {c.lastMessageAt}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {resolvePropertyName(c.propertyId)}
                        {c.reservationId ? " · Con reserva" : ""}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {c.lastMessage}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <PlatformBadge platform={c.platform} />
                        <IntentCategoryBadge category={c.intentCategory} />
                        {analysis?.status === "auto_sent" && (
                          <Badge variant="success" className="text-[9px]">
                            IA automática
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
