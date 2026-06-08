"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, KeyRound, MapPin, ShieldCheck, Wifi } from "lucide-react";
import type { Property, Reservation } from "@/types";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabels: Record<Property["status"], { label: string; variant: "success" | "warning" | "secondary" | "danger" }> = {
  disponible: { label: "Disponible", variant: "success" },
  ocupada: { label: "Ocupada", variant: "secondary" },
  limpieza: { label: "En limpieza", variant: "warning" },
  mantenimiento: { label: "Mantenimiento", variant: "danger" },
};

type PropertyCardProps = {
  property: Property;
  upcoming?: Reservation;
  onViewDetails: () => void;
};

export function PropertyCard({ property, upcoming, onViewDetails }: PropertyCardProps) {
  const st = statusLabels[property.status];
  const [imageError, setImageError] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_14px_34px_-32px_rgba(37,35,29,0.35)]">
      <div className="relative h-44 w-full overflow-hidden bg-olive">
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2c3a2b,#58684b)] px-8 text-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/70">
                InnIA Property
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-cream">{property.name}</p>
            </div>
          </div>
        ) : (
          <Image
            src={property.image}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <Badge variant={st.variant} className="absolute left-3 top-3 bg-white/95">
          {st.label}
        </Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="truncate text-lg font-semibold tracking-tight text-white">
            {property.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/82">
            <MapPin className="h-3.5 w-3.5" />
            {property.location}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border/70 bg-warm-panel/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ocupación
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{property.occupancy}%</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-warm-panel/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Cerradura
            </p>
            <p className={cn("flex items-center gap-1 font-medium", property.smartLockOnline ? "text-emerald-600" : "text-danger")}>
              <KeyRound className="h-3.5 w-3.5" />
              {property.smartLockOnline ? "En línea" : "Sin conexión"}
            </p>
          </div>
        </div>
        {upcoming && (
          <div className="rounded-xl border border-border/70 bg-white p-3 text-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Próxima reserva
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-semibold">{upcoming.guestName}</p>
              <span className="text-xs tabular-nums text-muted-foreground">{upcoming.checkIn}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Canales conectados
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {property.platforms.map((p) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-center" onClick={onViewDetails}>
          Ver detalles internos
        </Button>
      </div>
    </article>
  );
}

export function PropertyDetailPanel({ property }: { property: Property }) {
  return (
    <div className="space-y-4 text-sm">
      {property.wifi && (
        <div className="flex gap-2">
          <Wifi className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">WiFi</p>
            <p className="text-muted-foreground">{property.wifi}</p>
          </div>
        </div>
      )}
      {property.houseRules && (
        <div>
          <p className="font-medium">Reglas de la casa</p>
          <p className="text-muted-foreground">{property.houseRules}</p>
        </div>
      )}
      {property.checkInInstructions && (
        <div>
          <p className="font-medium">Instrucciones de check-in</p>
          <p className="text-muted-foreground">{property.checkInInstructions}</p>
        </div>
      )}
      {property.checkOutInstructions && (
        <div>
          <p className="font-medium">Instrucciones de check-out</p>
          <p className="text-muted-foreground">{property.checkOutInstructions}</p>
        </div>
      )}
      <div>
        <p className="font-medium">Base de conocimiento IA</p>
        <p className="text-muted-foreground">
          12 respuestas automáticas configuradas para esta propiedad.
        </p>
      </div>
      <div>
        <p className="font-medium">Canales conectados</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {property.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
