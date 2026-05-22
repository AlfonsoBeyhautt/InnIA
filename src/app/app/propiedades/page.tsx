"use client";

import { useEffect, useMemo, useState } from "react";
import { useProperty } from "@/context/property-context";
import { preferApi } from "@/lib/prefer-api";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyEditor } from "@/components/properties/property-editor";
import { useApi } from "@/lib/hooks/use-api";
import type { Property, Reservation } from "@/types";

export default function PropiedadesPage() {
  const { selectedProperty, setSelectedProperty } = useProperty();
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
    <div className="ci-page mx-auto max-w-6xl space-y-4 max-lg:space-y-4 lg:space-y-6">
      <header>
        <h1 className="text-lg font-semibold lg:text-2xl">Propiedades</h1>
        <p className="text-xs text-muted-foreground lg:text-base">
          Administración interna de tus alojamientos — datos persistentes en Supabase.
        </p>
      </header>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          {list.length === 0
            ? "No hay propiedades cargadas. Agregá tu primera propiedad para comenzar."
            : "No hay propiedades para el filtro seleccionado."}
        </p>
      ) : (
        <div className="grid gap-3 max-lg:gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-6">
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
          onDeleted={(id) => {
            setList((prev) => prev.filter((p) => p.id !== id && p.dbId !== detail.dbId));
            setDetail(null);
            if (selectedProperty === id || selectedProperty === detail.id) {
              setSelectedProperty("all");
            }
            void refetchProperties();
            void refetchReservations();
          }}
        />
      )}
    </div>
  );
}
