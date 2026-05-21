"use client";

import { useMemo } from "react";
import { KeyRound } from "lucide-react";
import { useProperty } from "@/context/property-context";
import { preferApi } from "@/lib/prefer-api";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import type { Property, SmartLock } from "@/types";
import { SmartLockCard } from "@/components/locks/smart-lock-card";

function propertyToLock(p: Property): SmartLock {
  return {
    id: p.dbId ?? p.id,
    propertyId: p.id,
    name: p.name,
    online: p.smartLockOnline,
    battery: p.smartLockOnline ? 100 : 0,
    currentCode: "—",
    currentGuest: "—",
    validUntil: "—",
  };
}

export default function CerradurasPage() {
  const { selectedProperty } = useProperty();
  const { user } = useSession();
  const { data: apiProperties } = useApi<Property[]>(user ? "/api/properties" : null, []);
  const properties = preferApi(apiProperties);

  const locks = useMemo(() => {
    const list =
      selectedProperty === "all"
        ? properties
        : properties.filter((p) => p.id === selectedProperty);
    return list.map(propertyToLock);
  }, [properties, selectedProperty]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Cerraduras inteligentes</h1>
        <p className="text-muted-foreground">Códigos, accesos y estado de cada cerradura.</p>
      </header>

      {locks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-16 text-center">
          <KeyRound className="mb-3 h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">No hay cerraduras configuradas.</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Activá «Cerradura inteligente en línea» en cada propiedad para verlas aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locks.map((lock) => (
            <SmartLockCard key={lock.id} lock={lock} />
          ))}
        </div>
      )}

      <section className="card-surface p-5">
        <h2 className="mb-4 font-semibold">Historial de accesos</h2>
        {locks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros de acceso todavía.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            El historial de accesos aparecerá cuando se registren eventos desde tus cerraduras.
          </p>
        )}
      </section>
    </div>
  );
}
