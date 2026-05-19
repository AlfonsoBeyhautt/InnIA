"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Inbox, Sparkles } from "lucide-react";
import type { Conversation } from "@/types";
import { cn, propertyName } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type InboxAttentionPanelProps = {
  conversations: Conversation[];
};

export function InboxAttentionPanel({ conversations }: InboxAttentionPanelProps) {
  const attention = conversations
    .filter((c) => c.unread || c.urgency !== "normal")
    .sort((a, b) => {
      if (a.urgency === "urgente" && b.urgency !== "urgente") return -1;
      if (b.urgency === "urgente" && a.urgency !== "urgente") return 1;
      return 0;
    })
    .slice(0, 4);

  return (
    <aside className="ci-elevated flex flex-col overflow-hidden border-primary/15 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-primary/15 bg-gradient-to-r from-sand via-card to-card px-5 py-5"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Inbox className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Centro de mensajes</h2>
            <p className="text-xs text-muted-foreground">Todos tus canales en un solo lugar</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {attention.length > 0
            ? `${attention.length} conversaciones necesitan tu revisión`
            : "Bandeja al día"}
        </p>
      </motion.div>

      <ul className="flex-1 overflow-y-auto">
        {attention.length === 0 ? (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">
            No hay mensajes pendientes.
          </li>
        ) : (
          attention.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-border/50 last:border-0"
            >
              <Link
                href="/app/inbox"
                className={cn(
                  "block px-5 py-4 transition-all hover:bg-primary/5",
                  c.urgency === "urgente" && "bg-red-50/40"
                )}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback>{getInitials(c.guestName)}</AvatarFallback>
                    </Avatar>
                    {c.unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm">{c.guestName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {c.lastMessageAt}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <PlatformBadge platform={c.platform} />
                      <span className="text-[11px] text-muted-foreground">
                        {propertyName(c.propertyId)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {c.lastMessage}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.urgency === "urgente" && (
                        <Badge variant="danger" className="text-[10px]">
                          Urgente
                        </Badge>
                      )}
                      {c.urgency === "revisar" && (
                        <Badge variant="warning" className="text-[10px]">
                          Requiere revisión
                        </Badge>
                      )}
                      {c.labels.slice(0, 1).map((l) => (
                        <Badge key={l} variant="secondary" className="text-[10px]">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))
        )}
      </ul>

      <div className="border-t border-border/60 bg-sand/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Airbnb · Booking · WhatsApp · Email unificados</span>
        </div>
        <Button asChild className="w-full gap-2 shadow-sm" size="lg">
          <Link href="/app/inbox">
            Ir al Centro de mensajes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}

/** @deprecated use InboxAttentionPanel */
export const InboxPreviewRail = InboxAttentionPanel;
