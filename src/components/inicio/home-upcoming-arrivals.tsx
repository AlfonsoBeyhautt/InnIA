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
    <section className="ci-card-compact flex h-full min-h-0 flex-col max-lg:min-h-[180px] lg:min-h-[260px] lg:rounded-[20px] lg:p-5 lg:shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)]">
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
          <li className="rounded-xl bg-sand/50 px-4 py-6 text-center text-sm text-muted-foreground">
            No hay llegadas programadas.
          </li>
        ) : (
          upcoming.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-cream/40 px-3 py-3 transition-colors hover:bg-sand/60"
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
