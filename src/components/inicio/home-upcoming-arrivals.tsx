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
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-white lg:h-[350px] lg:min-h-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
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

      <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
        {upcoming.length === 0 ? (
          <li className="flex h-full min-h-[160px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
            No hay llegadas próximas para el filtro actual.
          </li>
        ) : (
          upcoming.map((r) => (
            <li
              key={r.id}
              className="grid min-h-[62px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sand/35"
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
              <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
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
