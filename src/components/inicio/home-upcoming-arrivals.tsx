"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, PlaneLanding } from "lucide-react";
import type { Reservation } from "@/types";
import { propertyName } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function formatShortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function HomeUpcomingArrivals({ reservations }: { reservations: Reservation[] }) {
  const upcoming = reservations
    .filter((r) => r.status === "check-in" || r.status === "confirmada")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[22px] border border-border/65 bg-card/95 p-3.5 shadow-[0_18px_48px_-42px_rgba(46,58,42,0.48),0_1px_0_rgba(255,255,255,0.85)_inset] max-lg:rounded-2xl lg:h-[350px] lg:min-h-0 lg:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Próximas llegadas
          </h2>
          <p className="text-xs text-muted-foreground">
            Huéspedes, fechas y propiedad
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-xs">
          <Link href="/app/reservas">
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {upcoming.length === 0 ? (
          <li className="flex h-full min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-sand/35 px-4 text-center text-sm text-muted-foreground">
            No hay llegadas próximas.
          </li>
        ) : (
          upcoming.map((r) => (
            <li
              key={r.id}
              className="grid min-h-[62px] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border/55 bg-cream/55 px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-colors hover:bg-sand/65"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(r.guestName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-5">{r.guestName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {propertyName(r.propertyId)} · {r.platform}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  {formatShortDate(r.checkIn)} → {formatShortDate(r.checkOut)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                <PlaneLanding className="h-3.5 w-3.5" />
                {r.status === "check-in" ? "En curso" : "Confirmada"}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
