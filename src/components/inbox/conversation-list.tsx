"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox, type InboxFilter } from "@/context/inbox-context";
import { useProperty } from "@/context/property-context";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { IntentCategoryBadge } from "@/components/inbox/intent-category-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InboxEmptyState } from "@/components/inbox/inbox-empty-state";
import type { InboxIntentTab, Platform } from "@/types";

const intentTabs: { id: InboxIntentTab; label: string }[] = [
  { id: "nueva_consulta", label: "Nuevas consultas" },
  { id: "huesped_activo", label: "Huéspedes activos" },
  { id: "comercial", label: "Comercial" },
  { id: "todos", label: "Todos" },
];

const statusFilters: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Sin leer" },
  { id: "review", label: "Revisar" },
];

const channelFilters: { id: Platform | "all"; label: string }[] = [
  { id: "all", label: "Canal" },
  { id: "WhatsApp", label: "WhatsApp" },
  { id: "Instagram", label: "Instagram" },
  { id: "Airbnb", label: "Airbnb" },
  { id: "Booking", label: "Booking" },
];

export function ConversationList() {
  const {
    conversations,
    intentCounts,
    selectedId,
    setSelectedId,
    intentTab,
    setIntentTab,
    channelFilter,
    setChannelFilter,
    filter,
    setFilter,
    search,
    setSearch,
    getAnalysis,
  } = useInbox();
  const { resolvePropertyName } = useProperty();

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="shrink-0 space-y-1.5 border-b border-border/70 p-2 max-lg:p-2.5 lg:space-y-2 lg:p-3">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {intentTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setIntentTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                intentTab === tab.id
                  ? "bg-olive text-cream"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px]",
                  intentTab === tab.id ? "bg-cream/20" : "bg-background"
                )}
              >
                {intentCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="h-8 max-lg:h-9 border-border/80 bg-sand/50 pl-8 text-sm max-lg:text-xs lg:h-9"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {channelFilters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelFilter(ch.id)}
              className={cn(
                "rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors",
                channelFilter === ch.id
                  ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {ch.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === f.id
                  ? "bg-olive/90 text-cream"
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
          <InboxEmptyState />
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
                      "flex w-full gap-2 px-2.5 py-2.5 text-left transition-colors max-lg:gap-2 lg:gap-2.5 lg:px-3 lg:py-3",
                      active
                        ? "bg-primary/12 ring-1 ring-inset ring-primary/20"
                        : "hover:bg-sand/60",
                      c.urgency === "urgente" && !active && "border-l-2 border-l-terracotta"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(c.guestName)}
                        </AvatarFallback>
                      </Avatar>
                      {c.unread && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
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
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
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
