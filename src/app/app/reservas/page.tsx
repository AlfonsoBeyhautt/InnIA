"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { useToast } from "@/context/toast-context";
import { useProperty } from "@/context/property-context";
import { filterByProperty, propertyName } from "@/lib/utils";
import { preferApi } from "@/lib/prefer-api";
import { useApi } from "@/lib/hooks/use-api";
import {
  PmsTimelineCalendar,
  getDefaultRangeStart,
  type CalendarViewRange,
} from "@/components/reservations/pms-timeline-calendar";
import { ReservationDetailPanel } from "@/components/reservations/reservation-detail-panel";
import { addDays } from "@/lib/calendar-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/types";

function OperationalChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium",
        highlight
          ? "border-amber-300/60 bg-amber-50 text-amber-900"
          : "border-border/70 bg-white text-foreground"
      )}
    >
      <span className="font-bold tabular-nums">{value}</span>
      {label}
    </span>
  );
}

export default function ReservasPage() {
  const { toast } = useToast();
  const { selectedProperty } = useProperty();
  const [view, setView] = useState<CalendarViewRange>("quincena");
  const [rangeStart, setRangeStart] = useState(getDefaultRangeStart);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);

  const { data, refetch } = useApi<Reservation[]>(
    `/api/reservations${selectedProperty !== "all" ? `?property=${selectedProperty}` : ""}`,
    []
  );
  const reservations = preferApi(data);

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  const filtered = useMemo(
    () => filterByProperty(reservations, selectedProperty),
    [selectedProperty, reservations]
  );

  const selectedReservation: Reservation | null =
    filtered.find((r) => r.id === selectedReservationId) ?? null;

  const checkInsToday = filtered.filter((r) => r.status === "check-in").length;
  const checkOutsToday = filtered.filter((r) => r.status === "check-out").length;
  const toReview = filtered.filter((r) => r.paymentStatus === "pendiente").length;
  const pendingCodes = filtered.filter((r) => r.lockCodeStatus === "pendiente").length;

  const shiftRange = (dir: -1 | 1) => {
    const step = view === "semana" ? 7 : view === "quincena" ? 14 : 30;
    setRangeStart((d) => addDays(d, dir * step));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="shrink-0 border-b border-border/70 bg-card px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Reservas</h1>
            <p className="text-sm text-muted-foreground">
              Calendario operativo por unidad
              {selectedProperty !== "all" && ` · ${propertyName(selectedProperty)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OperationalChip label="Check-ins hoy" value={checkInsToday} highlight={checkInsToday > 0} />
            <OperationalChip label="Check-outs hoy" value={checkOutsToday} />
            <OperationalChip label="Por revisar" value={toReview} highlight={toReview > 0} />
            <OperationalChip label="Códigos pend." value={pendingCodes} highlight={pendingCodes > 0} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/70 bg-sand/60 p-0.5">
            {(["semana", "quincena", "mes"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  view === v ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "semana" ? "Semana" : v === "quincena" ? "Quincena" : "Mes"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftRange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-xs font-medium text-foreground">
              {rangeStart.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftRange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              if (filtered.length === 0) {
                toast("No hay reservas para exportar.", "info");
                return;
              }
              downloadCsv(
                "reservas",
                [
                  "Huésped",
                  "Propiedad",
                  "Check-in",
                  "Check-out",
                  "Plataforma",
                  "Estado",
                  "Pago",
                  "Monto",
                ],
                filtered.map((r) => [
                  r.guestName,
                  propertyName(r.propertyId),
                  r.checkIn,
                  r.checkOut,
                  r.platform,
                  r.status,
                  r.paymentStatus,
                  String(r.amount),
                ])
              );
              toast(`Exportadas ${filtered.length} reservas.`, "success");
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            onClick={() => setDetailOpen((o) => !o)}
          >
            {detailOpen ? "Ocultar detalle" : "Ver detalle"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
          {filtered.length === 0 ? (
            <p className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 text-center text-sm text-muted-foreground">
              No hay reservas todavía.
            </p>
          ) : (
            <PmsTimelineCalendar
              reservations={filtered}
              propertyFilter={selectedProperty}
              range={view}
              rangeStart={rangeStart}
              selectedReservationId={selectedReservationId}
              onSelectReservation={(id) => {
                setSelectedReservationId(id);
                setDetailOpen(true);
              }}
            />
          )}
        </div>
        {detailOpen && (
          <div className="w-full max-w-[340px] shrink-0 border-l border-border/70 bg-card p-3 sm:w-[340px]">
            <ReservationDetailPanel
              reservation={selectedReservation}
              onClose={() => setDetailOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
