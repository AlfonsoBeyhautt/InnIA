"use client";

import { useEffect } from "react";
import { guests as mockGuests } from "@/data/mock";
import { GuestDatabase } from "@/components/crm/guest-database";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { Guest } from "@/types";
import { Download, Loader2, UserPlus } from "lucide-react";

export default function CRMPage() {
  const { data, loading, error, refetch } = useApi<Guest[]>("/api/guests", mockGuests);
  const guests = data && data.length > 0 ? data : mockGuests;

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  return (
    <div className="ci-page ci-page-wide space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Administración
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Base de datos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Expediente central de huéspedes e inquilinos: identidad, historial, pagos,
            incidentes y datos para alquiler temporal.
            {error && (
              <span className="mt-1 block text-amber-700">
                Modo local (mock): {error}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => refetch()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Actualizar
          </Button>
        </div>
      </header>
      <GuestDatabase guests={guests} onSave={refetch} />
    </div>
  );
}
