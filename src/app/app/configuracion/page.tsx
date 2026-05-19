"use client";

import { SettingsDashboard } from "@/components/settings/settings-dashboard";

export default function ConfiguracionPage() {
  return (
    <div className="ci-page ci-page-wide space-y-5">
      <header className="border-b border-border/70 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Sistema</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuenta, integraciones, equipo y preferencias de la plataforma.
        </p>
      </header>
      <SettingsDashboard />
    </div>
  );
}
