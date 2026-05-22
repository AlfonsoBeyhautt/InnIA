"use client";

import { Bot, CalendarDays, Inbox, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const conversations = [
  { name: "María G.", channel: "WhatsApp", preview: "¿A qué hora es el check-in?", urgent: true },
  { name: "Lucas P.", channel: "Airbnb", preview: "Gracias por la info del wifi", urgent: false },
  { name: "Ana R.", channel: "Instagram", preview: "Consulta por fin de semana", urgent: true },
];

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_64px_-20px_rgba(62,79,60,0.28)]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 bg-sand/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <span className="ml-2 text-[11px] font-medium text-muted-foreground">Centro de mensajes — InnIA</span>
      </div>

      <div className="flex min-h-[320px] bg-muted/40 sm:min-h-[380px]">
        <aside className="hidden w-14 shrink-0 flex-col gap-2 border-r border-border/60 bg-olive p-2 sm:flex">
          {[Inbox, CalendarDays, Sparkles].map((Icon, i) => (
            <div
              key={i}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                i === 0 ? "bg-cream/20 text-cream" : "text-cream/60"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </aside>

        <div className="flex w-[38%] shrink-0 flex-col border-r border-border/60 bg-card">
          <div className="border-b border-border/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Conversaciones</p>
          </div>
          <ul className="divide-y divide-border/50">
            {conversations.map((c, i) => (
              <li
                key={c.name}
                className={cn(
                  "px-3 py-2.5",
                  i === 0 && "bg-primary/6"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold">{c.name}</span>
                  {c.urgent && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{c.preview}</p>
                <span className="mt-1 inline-block rounded bg-sand px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {c.channel}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="border-b border-border/60 px-4 py-2.5">
            <p className="text-xs font-semibold">María G.</p>
            <p className="text-[10px] text-muted-foreground">Casa de verano · WhatsApp</p>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden p-3">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-white px-3 py-2 text-[11px] shadow-sm">
              ¿A qué hora es el check-in?
            </div>
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm border border-primary/20 bg-primary/8 px-3 py-2 text-[11px]">
              <span className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase text-primary">
                <Bot className="h-3 w-3" />
                IA InnIA
              </span>
              Check-in desde las 15:00. Te enviamos el código de acceso por WhatsApp.
            </div>
          </div>
          <div className="border-t border-border/60 p-2">
            <div className="h-8 rounded-lg bg-sand/80" />
          </div>
        </div>

        <aside className="hidden w-[28%] shrink-0 flex-col border-l border-border/60 bg-card lg:flex">
          <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-primary">Asistente IA</span>
          </div>
          <div className="space-y-2 p-3">
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-2 text-[10px] text-emerald-950">
              Respondido automáticamente · check-in
            </div>
            <div className="rounded-lg border border-border/60 bg-sand/50 p-2 text-[10px] text-muted-foreground">
              Intención: consulta operativa
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
