"use client";

import Link from "next/link";
import { ArrowRight, PlaneLanding } from "lucide-react";
import type { Reservation } from "@/types";
import { propertyName } from "@/lib/utils";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function HomeUpcomingArrivals({ reservations }: { reservations: Reservation[] }) {
  const upcoming = reservations
    .filter((r) => r.status === "check-in" || r.status === "confirmada")
    .slice(0, 4);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[24px] border border-border/65 bg-card/95 p-5 shadow-[0_22px_52px_-42px_rgba(46,58,42,0.48),0_1px_0_rgba(255,255,255,0.85)_inset] max-lg:min-h-[180px] max-lg:rounded-2xl lg:min-h-[260px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="ci-section-title">Próximas llegadas</h2>
          <p className="ci-section-sub">Check-ins y llegadas del día</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80">
          <Link href="/app/reservas">
            Ver calendario
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="space-y-3">
        {upcoming.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border/70 bg-sand/45 px-4 py-8 text-center text-sm text-muted-foreground">
            No hay llegadas programadas.
          </li>
        ) : (
          upcoming.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border border-border/55 bg-cream/55 px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-colors hover:bg-sand/65"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(r.guestName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.guestName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {propertyName(r.propertyId)} · {r.platform}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                <PlaneLanding className="h-3.5 w-3.5" />
                {r.checkIn}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
