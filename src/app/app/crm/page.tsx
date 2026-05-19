"use client";

import { useEffect, useState } from "react";
import { guests as mockGuests } from "@/data/mock";
import { GuestDatabase } from "@/components/crm/guest-database";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";
import type { Guest } from "@/types";
import { exportGuestsCsv } from "@/lib/guest-filters";
import { useToast } from "@/context/toast-context";
import { Download, UserPlus } from "lucide-react";

export default function CRMPage() {
  const { toast } = useToast();
  const { data, loading, error, refetch } = useApi<Guest[]>("/api/guests", mockGuests);
  const guests = data && data.length > 0 ? data : mockGuests;
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>(guests);
  const [addSignal, setAddSignal] = useState(0);

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  useEffect(() => {
    setFilteredGuests(guests);
  }, [guests]);

  const handleExport = () => {
    if (filteredGuests.length === 0) {
      toast("No hay registros para exportar con los filtros actuales.", "info");
      return;
    }
    exportGuestsCsv(filteredGuests, "base-datos-huespedes");
    toast(`Exportados ${filteredGuests.length} huéspedes.`, "success");
  };

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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setAddSignal((n) => n + 1)}
          >
            <UserPlus className="h-4 w-4" />
            Agregar huésped
          </Button>
        </div>
      </header>
      <GuestDatabase
        guests={guests}
        onSave={refetch}
        onFilteredChange={setFilteredGuests}
        openAddSignal={addSignal}
      />
    </div>
  );
}
