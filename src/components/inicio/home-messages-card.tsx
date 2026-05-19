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
    .slice(0, 4);

  return (
    <section className="flex h-full min-h-[260px] flex-col rounded-[20px] border border-border/70 bg-card p-5 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="ci-section-title">Mensajes importantes</h2>
          <p className="ci-section-sub">Conversaciones que requieren atención</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80">
          <Link href="/app/inbox">
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-xl bg-sand/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Bandeja al día.
          </li>
        ) : (
          items.map((c) => (
            <li key={c.id}>
              <Link
                href="/app/inbox"
                className="flex gap-3 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-border/60 hover:bg-sand/50"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(c.guestName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.guestName}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.lastMessageAt}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.lastMessage}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <PlatformBadge platform={c.platform} />
                    <span className="text-[11px] text-muted-foreground">
                      {propertyName(c.propertyId)}
                    </span>
                    {c.urgency === "urgente" && (
                      <Badge variant="danger" className="text-[10px]">
                        Urgente
                      </Badge>
                    )}
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
