"use client";

import Image from "next/image";
import { KeyRound, Wifi } from "lucide-react";
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

  return (
    <article className="card-surface overflow-hidden">
      <div className="relative h-40 w-full">
        <Image
          src={property.image}
          alt={property.name}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <Badge variant={st.variant} className="absolute left-3 top-3">
          {st.label}
        </Badge>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold">{property.name}</h3>
          <p className="text-sm text-muted-foreground">{property.location}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Ocupación</p>
            <p className="font-medium">{property.occupancy}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cerradura</p>
            <p className={cn("flex items-center gap-1 font-medium", property.smartLockOnline ? "text-emerald-600" : "text-danger")}>
              <KeyRound className="h-3.5 w-3.5" />
              {property.smartLockOnline ? "En línea" : "Sin conexión"}
            </p>
          </div>
        </div>
        {upcoming && (
          <div className="rounded-xl bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">Próxima reserva</p>
            <p className="font-medium">{upcoming.guestName}</p>
            <p className="text-xs text-muted-foreground">{upcoming.checkIn}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {property.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
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
