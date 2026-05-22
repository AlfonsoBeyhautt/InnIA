"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { unitsFromPropertyOptions } from "@/lib/property-units";
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
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium max-lg:px-2 max-lg:py-1 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-xs",
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
  const { selectedProperty, properties } = useProperty();
  const [view, setView] = useState<CalendarViewRange>("quincena");
  const [rangeStart, setRangeStart] = useState(getDefaultRangeStart);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const desktopDetailSynced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches && !desktopDetailSynced.current) {
        setDetailOpen(true);
        desktopDetailSynced.current = true;
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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

  const placeholderUnits = useMemo(
    () =>
      unitsFromPropertyOptions(
        properties.map((p) => ({ id: p.id, name: p.name })),
        selectedProperty
      ),
    [properties, selectedProperty]
  );

  const calendarEmptyBanner = (
    <>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          No hay reservas cargadas para este período.
        </p>
        <p className="text-xs text-muted-foreground">
          El calendario sigue disponible para navegar fechas y unidades.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/app/reservas">Crear reserva</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/app/configuracion">Sincronizar calendario</Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col max-lg:h-[calc(100dvh-3rem-env(safe-area-inset-top,0px))] lg:h-[calc(100vh-4rem)]">
      <div className="shrink-0 border-b border-border/70 bg-card px-3 py-2.5 max-lg:sticky max-lg:top-0 max-lg:z-10 sm:px-4 sm:py-3 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 max-lg:gap-2 lg:gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-foreground lg:text-xl">
              Reservas
            </h1>
            <p className="text-xs text-muted-foreground max-lg:truncate lg:text-sm">
              Calendario operativo por unidad
              {selectedProperty !== "all" && ` · ${propertyName(selectedProperty)}`}
            </p>
          </div>
          <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5 max-lg:max-w-full lg:mx-0 lg:flex-wrap lg:gap-2">
            <OperationalChip label="Check-ins hoy" value={checkInsToday} highlight={checkInsToday > 0} />
            <OperationalChip label="Check-outs hoy" value={checkOutsToday} />
            <OperationalChip label="Por revisar" value={toReview} highlight={toReview > 0} />
            <OperationalChip label="Códigos pend." value={pendingCodes} highlight={pendingCodes > 0} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 max-lg:mt-2 lg:mt-3 lg:gap-2">
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
            className="ml-auto hidden text-xs lg:inline-flex"
            onClick={() => setDetailOpen((o) => !o)}
          >
            {detailOpen ? "Ocultar detalle" : "Ver detalle"}
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 max-lg:p-2 lg:p-3 xl:p-4">
          <PmsTimelineCalendar
            reservations={filtered}
            propertyFilter={selectedProperty}
            range={view}
            rangeStart={rangeStart}
            selectedReservationId={selectedReservationId}
            placeholderUnits={placeholderUnits}
            emptyBanner={filtered.length === 0 ? calendarEmptyBanner : undefined}
            onSelectReservation={(id) => {
              setSelectedReservationId(id);
              setDetailOpen(true);
            }}
          />
        </div>

        {detailOpen && selectedReservation && (
          <>
            <button
              type="button"
              aria-label="Cerrar detalle"
              className="fixed inset-0 z-40 bg-black/35 lg:hidden"
              onClick={() => setDetailOpen(false)}
            />
            <div className="ci-safe-bottom fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85dvh,560px)] flex-col overflow-hidden rounded-t-2xl border-t border-border/70 bg-card shadow-2xl lg:hidden">
              <div className="flex shrink-0 items-center justify-center py-2">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <ReservationDetailPanel
                  reservation={selectedReservation}
                  onClose={() => setDetailOpen(false)}
                />
              </div>
            </div>
          </>
        )}

        {detailOpen && (
          <div className="hidden w-[340px] max-w-[340px] shrink-0 border-l border-border/70 bg-card p-3 lg:block">
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
