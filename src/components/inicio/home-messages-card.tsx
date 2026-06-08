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
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-terracotta/35 bg-white lg:h-[350px] lg:min-h-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
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

      <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
        {items.length === 0 ? (
          <li className="flex h-full min-h-[160px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
            No hay conversaciones pendientes para revisar.
          </li>
        ) : (
          items.map((c) => (
            <li key={c.id}>
              <Link
                href="/app/inbox"
                className="flex min-h-[62px] gap-3 px-4 py-2.5 transition-colors hover:bg-sand/35"
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
