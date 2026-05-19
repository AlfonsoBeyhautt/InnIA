"use client";

import { useEffect, useMemo, useState } from "react";
import { useProperty } from "@/context/property-context";
import { properties as mockProperties, reservations as mockReservations } from "@/data/mock";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyEditPanel } from "@/components/properties/property-edit-panel";
import { useApi } from "@/lib/hooks/use-api";
import type { Property, Reservation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PropiedadesPage() {
  const { selectedProperty } = useProperty();
  const { data: apiProperties, refetch: refetchProperties } = useApi<Property[]>(
    "/api/properties",
    mockProperties
  );
  const { data: apiReservations, refetch: refetchReservations } = useApi<Reservation[]>(
    "/api/reservations",
    mockReservations
  );
  const properties =
    apiProperties && apiProperties.length > 0 ? apiProperties : mockProperties;
  const reservations =
    apiReservations && apiReservations.length > 0 ? apiReservations : mockReservations;

  useEffect(() => {
    const onReady = () => {
      void refetchProperties();
      void refetchReservations();
    };
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetchProperties, refetchReservations]);
  const [detail, setDetail] = useState<Property | null>(null);

  const filtered = useMemo(
    () =>
      selectedProperty === "all"
        ? properties
        : properties.filter((p) => p.id === selectedProperty),
    [selectedProperty, properties]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Propiedades</h1>
        <p className="text-muted-foreground">
          Administración interna de tus alojamientos — datos persistentes en Supabase.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const upcoming = reservations.find(
            (r) => r.propertyId === p.id && r.status !== "cancelada"
          );
          return (
            <PropertyCard
              key={p.dbId ?? p.id}
              property={p}
              upcoming={upcoming}
              onViewDetails={() => setDetail(p)}
            />
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <PropertyEditPanel
              property={detail}
              onSaved={(p) => {
                setDetail(p);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
