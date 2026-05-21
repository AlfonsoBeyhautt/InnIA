"use client";

import { useEffect, useMemo, useState } from "react";
import { useProperty } from "@/context/property-context";
import { preferApi } from "@/lib/prefer-api";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyEditor } from "@/components/properties/property-editor";
import { useApi } from "@/lib/hooks/use-api";
import type { Property, Reservation } from "@/types";

export default function PropiedadesPage() {
  const { selectedProperty } = useProperty();
  const { data: apiProperties, refetch: refetchProperties } = useApi<Property[]>(
    "/api/properties",
    []
  );
  const { data: apiReservations, refetch: refetchReservations } = useApi<Reservation[]>(
    "/api/reservations",
    []
  );
  const properties = preferApi(apiProperties);
  const reservations = preferApi(apiReservations);

  const [detail, setDetail] = useState<Property | null>(null);
  const [list, setList] = useState<Property[]>(properties);

  useEffect(() => {
    setList(properties);
  }, [properties]);

  useEffect(() => {
    const refresh = () => {
      void refetchProperties();
      void refetchReservations();
    };
    window.addEventListener("innia:data-ready", refresh);
    window.addEventListener("innia:property-updated", refresh);
    return () => {
      window.removeEventListener("innia:data-ready", refresh);
      window.removeEventListener("innia:property-updated", refresh);
    };
  }, [refetchProperties, refetchReservations]);

  const filtered = useMemo(
    () =>
      selectedProperty === "all"
        ? list
        : list.filter((p) => p.id === selectedProperty),
    [selectedProperty, list]
  );

  const handleSaved = (updated: Property) => {
    setList((prev) =>
      prev.map((p) => (p.id === updated.id || p.dbId === updated.dbId ? updated : p))
    );
    setDetail(updated);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Propiedades</h1>
        <p className="text-muted-foreground">
          Administración interna de tus alojamientos — datos persistentes en Supabase.
        </p>
      </header>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          No hay propiedades para el filtro seleccionado.
        </p>
      ) : (
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
      )}

      {detail && (
        <PropertyEditor
          property={detail}
          open={!!detail}
          onOpenChange={(open) => !open && setDetail(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
