"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import type { AppStats } from "@/lib/db/app-stats";
import type { OwnerAiSettings } from "@/lib/ai/owner-settings";
import { AddPropertyDialog } from "@/components/properties/add-property-dialog";
import { useToast } from "@/context/toast-context";
import {
  BedDouble,
  Bot,
  CreditCard,
  KeyRound,
  Mail,
  User,
  Users,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { ProfileSection } from "@/components/settings/profile-section";

type SectionId =
  | "perfil"
  | "propiedades"
  | "integraciones"
  | "cerraduras"
  | "ia"
  | "equipo"
  | "facturacion";

const nav: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: "perfil", label: "Perfil y cuenta", icon: User },
  { id: "propiedades", label: "Propiedades", icon: BedDouble },
  { id: "integraciones", label: "Integraciones", icon: Mail },
  { id: "cerraduras", label: "Cerraduras", icon: KeyRound },
  { id: "ia", label: "Asistente IA", icon: Bot },
  { id: "equipo", label: "Equipo", icon: Users },
  { id: "facturacion", label: "Facturación", icon: CreditCard },
];

function Toggle({ on }: { on: boolean; label: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </span>
  );
}

function SettingsDashboardInner() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const { data: stats } = useApi<AppStats>(user ? "/api/stats" : null);
  const { data: aiSettings, refetch: refetchAi } = useApi<OwnerAiSettings>(
    user ? "/api/settings/ai" : null,
    { ai_auto_classification: true, ai_auto_reply_enabled: true }
  );
  const [active, setActive] = useState<SectionId>("integraciones");
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "integraciones") setActive("integraciones");
  }, [searchParams]);

  const patchAiSettings = async (patch: Partial<OwnerAiSettings>) => {
    setSavingAi(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      await refetchAi();
      toast("Preferencias de IA guardadas.", "success");
    } catch {
      toast("No se pudieron guardar las preferencias.", "error");
    } finally {
      setSavingAi(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] overflow-hidden rounded-[22px] border border-border/80 bg-card shadow-[0_4px_24px_-8px_rgba(62,79,60,0.1)]">
      <nav className="w-56 shrink-0 border-r border-border/60 bg-olive/5 p-3">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Configuración
        </p>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    active === item.id
                      ? "bg-olive text-cream shadow-sm"
                      : "text-muted-foreground hover:bg-sand/80"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto p-6 sm:p-8">
        {active === "integraciones" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Integraciones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Canales conectados a InnIA. Estado en tiempo real.
              </p>
            </div>
            <IntegrationsPanel />
          </div>
        )}

        {active === "ia" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Asistente IA</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Respuestas automáticas, tono y base de conocimiento.
              </p>
            </div>
            <div className="space-y-4 rounded-xl border border-border/70 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Procesar mensajes automáticamente</p>
                  <p className="text-xs text-muted-foreground">
                    Al llegar un mensaje, la IA clasifica y responde sin botón manual
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingAi}
                  onClick={() =>
                    void patchAiSettings({
                      ai_auto_process_enabled: !(
                        aiSettings?.ai_auto_process_enabled !== false
                      ),
                    })
                  }
                >
                  <Toggle
                    on={aiSettings?.ai_auto_process_enabled !== false}
                    label="AutoProcess"
                  />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Respuestas automáticas</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar por WhatsApp cuando la IA tiene confianza alta
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingAi}
                  onClick={() =>
                    void patchAiSettings({
                      ai_auto_reply_enabled: !aiSettings?.ai_auto_reply_enabled,
                    })
                  }
                >
                  <Toggle on={aiSettings?.ai_auto_reply_enabled !== false} label="Auto" />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Clasificación automática</p>
                  <p className="text-xs text-muted-foreground">
                    Organiza conversaciones por intención (consultas, huéspedes, comercial)
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingAi}
                  onClick={() =>
                    void patchAiSettings({
                      ai_auto_classification: !(
                        aiSettings?.ai_auto_classification !== false
                      ),
                    })
                  }
                >
                  <Toggle
                    on={aiSettings?.ai_auto_classification !== false}
                    label="Classify"
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Reclasificación manual disponible en cada conversación del Centro de mensajes.
              </p>
              <Button variant="outline" size="sm">
                Actualizar base de conocimiento
              </Button>
            </div>
          </div>
        )}

        {active === "perfil" && <ProfileSection />}

        {active === "propiedades" && (
          <div className="max-w-xl space-y-4">
            <h2 className="text-lg font-semibold">Propiedades</h2>
            <p className="text-sm text-muted-foreground">
              {stats?.propertyCount ?? 0} propiedades · {stats?.unitCount ?? 0} unidades configuradas
            </p>
            <Button onClick={() => setAddPropertyOpen(true)}>Agregar propiedad</Button>
            <AddPropertyDialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen} />
          </div>
        )}

        {active === "cerraduras" && (
          <div className="max-w-xl space-y-4">
            <h2 className="text-lg font-semibold">Cerraduras inteligentes</h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4 text-success" />
              {(stats?.locksOnline ?? 0) > 0 || (stats?.locksOffline ?? 0) > 0
                ? `${stats?.locksOnline ?? 0} en línea · ${stats?.locksOffline ?? 0} sin conexión`
                : "Sin cerraduras configuradas"}
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/app/cerraduras">Ver dispositivos</a>
            </Button>
          </div>
        )}

        {active === "equipo" && (
          <div className="max-w-xl space-y-4">
            <h2 className="text-lg font-semibold">Equipo y permisos</h2>
            <p className="text-sm text-muted-foreground">2 usuarios activos</p>
            <Button variant="outline" size="sm">
              Invitar miembro
            </Button>
          </div>
        )}

        {active === "facturacion" && (
          <div className="max-w-xl space-y-4">
            <h2 className="text-lg font-semibold">Facturación</h2>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="font-semibold text-primary">Plan Pro</p>
              <p className="mt-1 text-sm text-muted-foreground">US$49/mes · Próximo cobro 1 jun 2026</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsDashboard() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Cargando…</div>}>
      <SettingsDashboardInner />
    </Suspense>
  );
}
