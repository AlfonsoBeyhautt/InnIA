"use client";

import { useState } from "react";
import { Database, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast-context";

type BootstrapResponse = {
  seeded: boolean;
  message: string;
  properties: number;
  guests: number;
  reservations: number;
  conversations: number;
  tasks: number;
  notifications: number;
  knowledgeItems?: number;
  adCampaigns?: number;
};

export function DemoDataPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<"load" | "reload" | "clear" | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const dispatchDataReady = () => {
    window.dispatchEvent(new CustomEvent("innia:data-ready"));
  };

  const runBootstrap = async (force: boolean) => {
    setLoading(force ? "reload" : "load");
    try {
      const res = await fetch("/api/demo/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = (await res.json()) as BootstrapResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al cargar datos");

      if (data.seeded) {
        const parts = [
          `${data.properties} propiedades`,
          `${data.guests} huéspedes`,
          `${data.reservations} reservas`,
          `${data.conversations} conversaciones`,
          `${data.tasks} tareas`,
          `${data.notifications} notificaciones`,
        ];
        if (data.knowledgeItems) parts.push(`${data.knowledgeItems} ítems de conocimiento`);
        if (data.adCampaigns) parts.push(`${data.adCampaigns} campañas`);
        setLastSummary(parts.join(" · "));
        toast(data.message, "success");
        dispatchDataReady();
      } else {
        toast(data.message, "info");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudieron cargar los datos demo", "error");
    } finally {
      setLoading(null);
    }
  };

  const runClear = async () => {
    const ok = window.confirm(
      "¿Borrar todos los datos operativos de tu cuenta?\n\nSe eliminarán propiedades, huéspedes, reservas, mensajes, tareas y notificaciones. Tu perfil y acceso no se tocan."
    );
    if (!ok) return;

    setLoading("clear");
    try {
      const res = await fetch("/api/demo/clear", { method: "DELETE" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al borrar");

      setLastSummary(null);
      toast(data.message ?? "Datos eliminados.", "success");
      dispatchDataReady();
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudieron borrar los datos", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Datos de demostración</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá un pack completo para explorar InnIA: 3 propiedades en Rocha, más de 13
          reservas con fechas cercanas a hoy, inbox con intenciones, tareas, notificaciones,
          base de conocimiento y campañas de ejemplo.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">Pack demo operativo</p>
            <p className="text-xs text-muted-foreground">
              Ideal para demos y pruebas. Si ya tenés datos, usá recargar para reemplazarlos por
              el pack limpio.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={loading !== null}
            onClick={() => void runBootstrap(false)}
          >
            {loading === "load" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Cargar datos demo
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => void runBootstrap(true)}
          >
            {loading === "reload" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Recargar pack (reemplaza todo)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={loading !== null}
            onClick={() => void runClear()}
          >
            {loading === "clear" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Borrar todos los datos
          </Button>
        </div>

        {lastSummary ? (
          <p className="text-xs text-muted-foreground">
            Última carga: {lastSummary}
          </p>
        ) : null}
      </div>
    </div>
  );
}
