"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Conversation } from "@/types";
import { cn, propertyName } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Button } from "@/components/ui/button";

type InboxPreviewRailProps = {
  conversations: Conversation[];
};

export function InboxPreviewRail({ conversations }: InboxPreviewRailProps) {
  const attention = conversations
    .filter((c) => c.unread || c.urgency !== "normal")
    .sort((a, b) => {
      if (a.urgency === "urgente" && b.urgency !== "urgente") return -1;
      if (b.urgency === "urgente" && a.urgency !== "urgente") return 1;
      return 0;
    })
    .slice(0, 4);

  return (
    <aside className="ci-surface flex flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
      <div className="border-b border-border/60 bg-sand/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Bandeja de atención</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensajes que necesitan tu mirada
        </p>
      </div>

      <ul className="flex-1 divide-y divide-border/60 overflow-y-auto">
        {attention.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">
            No hay mensajes pendientes. ¡Buen trabajo!
          </li>
        ) : (
          attention.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/app/inbox`}
                className={cn(
                  "group block px-5 py-4 transition-colors hover:bg-accent/40",
                  c.urgency === "urgente" && "border-l-[3px] border-l-danger bg-red-50/30"
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(c.guestName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-sm">{c.guestName}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {c.lastMessageAt}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <PlatformBadge platform={c.platform} />
                      <span className="text-[11px] text-muted-foreground">
                        {propertyName(c.propertyId)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-foreground">
                      {c.lastMessage}
                    </p>
                    {c.urgency === "urgente" && (
                      <span className="mt-2 inline-block text-[11px] font-medium text-danger">
                        Requiere atención ahora
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.li>
          ))
        )}
      </ul>

      <div className="border-t border-border/60 p-4">
        <Button asChild className="w-full gap-2" size="lg">
          <Link href="/app/inbox">
            Ir al Centro de mensajes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
