"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Conversation } from "@/types";
import { propertyName } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HomeMessagesCard({ conversations }: { conversations: Conversation[] }) {
  const items = conversations
    .filter((c) => c.unread || c.urgency !== "normal")
    .sort((a, b) => {
      const rank = { urgente: 0, revisar: 1, normal: 2 };
      return rank[a.urgency] - rank[b.urgency];
    });

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[22px] border border-terracotta/25 bg-card/95 p-3.5 shadow-[0_18px_50px_-40px_rgba(196,132,90,0.35),0_1px_0_rgba(255,255,255,0.85)_inset] max-lg:rounded-2xl lg:h-[350px] lg:min-h-0 lg:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Mensajes importantes
          </h2>
          <p className="text-xs text-muted-foreground">
            Conversaciones que requieren atención
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-xs">
          <Link href="/app/inbox">
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <li className="flex h-full min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-sand/35 px-4 text-center text-sm text-muted-foreground">
            No hay conversaciones pendientes.
          </li>
        ) : (
          items.map((c) => (
            <li key={c.id}>
              <Link
                href="/app/inbox"
                className="flex min-h-[62px] gap-3 rounded-2xl border border-border/55 bg-cream/45 px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-all hover:border-terracotta/30 hover:bg-sand/55"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(c.guestName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium leading-5">{c.guestName}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.lastMessageAt}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.lastMessage}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <PlatformBadge platform={c.platform} />
                    <span className="text-[11px] text-muted-foreground">
                      {propertyName(c.propertyId)}
                    </span>
                    <Badge
                      variant={c.urgency === "urgente" ? "danger" : "secondary"}
                      className="text-[10px]"
                    >
                      {c.urgency === "urgente" ? "Urgente" : c.unread ? "Sin leer" : "Revisar"}
                    </Badge>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
