"use client";

import { useProperty } from "@/context/property-context";
import { propertyName } from "@/lib/utils";

type DayHeaderProps = {
  attentionCount: number;
  aiResolvedCount: number;
};

function formatToday() {
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function DayHeader({ attentionCount, aiResolvedCount }: DayHeaderProps) {
  const { selectedProperty } = useProperty();
  const dateLabel = formatToday();

  return (
    <header className="ci-header-band">
      <div className="space-y-3">
        <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
          ¡Hola, Martín!
        </h1>
        <p className="max-w-2xl text-base font-medium text-foreground">
          {attentionCount > 0
            ? `Tenés ${attentionCount} ${attentionCount === 1 ? "asunto" : "asuntos"} que necesitan atención hoy.`
            : "No tenés asuntos urgentes pendientes hoy."}
        </p>
        <p className="text-sm text-muted-foreground">
          La IA resolvió {aiResolvedCount} consultas automáticamente.
        </p>
        {selectedProperty !== "all" && (
          <p className="text-sm text-muted-foreground">
            Vista filtrada:{" "}
            <span className="font-medium text-primary">{propertyName(selectedProperty)}</span>
            <span className="text-muted-foreground"> · Cambiá la propiedad desde la barra superior</span>
          </p>
        )}
      </div>
    </header>
  );
}
