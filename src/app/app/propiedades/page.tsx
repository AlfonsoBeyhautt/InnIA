"use client";

import { useEffect, useMemo, useState } from "react";
import { useProperty } from "@/context/property-context";
import { preferApi } from "@/lib/prefer-api";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyEditor } from "@/components/properties/property-editor";
import { useApi } from "@/lib/hooks/use-api";
import type { Property, Reservation } from "@/types";
import { Badge } from "@/components/ui/badge";

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
    <div className="ci-page ci-page-wide space-y-5">
      <header className="ci-enterprise-header">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Activos operativos
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Propiedades</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Inventario profesional de alojamientos, estado operativo, canales conectados y
              próximas reservas. Cada propiedad debe leerse como un activo administrado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{filtered.length} visibles</Badge>
            <Badge variant="success">{list.length} activos</Badge>
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-8">
          <p className="text-lg font-semibold">
            {list.length === 0 ? "Todavía no hay propiedades cargadas" : "Sin resultados para este filtro"}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {list.length === 0
              ? "Agregá tu primera propiedad para activar reservas, mensajes, cerraduras, reglas de casa y reportes por activo."
              : "Cambiá el filtro global de propiedad para volver al inventario completo."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
