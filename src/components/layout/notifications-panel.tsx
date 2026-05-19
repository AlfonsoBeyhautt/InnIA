"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  categoryLabels,
  type AppNotification,
} from "@/data/mock/notifications";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryVariant: Record<
  AppNotification["category"],
  "default" | "secondary" | "success" | "warning" | "danger"
> = {
  mensaje: "danger",
  reserva: "default",
  cerradura: "warning",
  operaciones: "secondary",
  ia: "default",
  pago: "success",
  tarea: "warning",
};

type NotificationsPanelProps = {
  items: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
};

export function NotificationsPanel({
  items,
  onMarkAllRead,
  onMarkRead,
}: NotificationsPanelProps) {
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
      <div className="flex items-center justify-between border-b border-primary/10 bg-sand/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold">Notificaciones</span>
          {unread > 0 && (
            <Badge variant="default" className="h-5 px-1.5 text-[10px]">
              {unread}
            </Badge>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary"
            onClick={onMarkAllRead}
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-[min(420px,70vh)]">
        <ul className="divide-y divide-border/60">
          {items.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </li>
          ) : (
            items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-primary/5",
                    !n.read && "bg-sand/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        !n.read ? "font-semibold text-foreground" : "text-foreground/90"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{n.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={categoryVariant[n.category]} className="text-[10px]">
                      {categoryLabels[n.category]}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{n.timestamp}</span>
                  </div>
                  {n.href && (
                    <Link
                      href={n.href}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Ver detalle →
                    </Link>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
