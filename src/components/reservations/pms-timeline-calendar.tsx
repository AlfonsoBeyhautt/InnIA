"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { cn, propertyName } from "@/lib/utils";
import type { PropertyId } from "@/types";
import type { Reservation } from "@/types";
import {
  unitsFromReservations,
  type PropertyUnit,
} from "@/lib/property-units";
import type { ReactNode } from "react";
import {
  DAY_WIDTH,
  ROW_HEIGHT,
  UNIT_COL_WIDTH,
  formatDayHeader,
  generateDateRange,
  platformTimelineStyles,
  reservationBarStyle,
} from "@/lib/calendar-utils";

export type CalendarViewRange = "semana" | "quincena" | "mes";

const VIEW_DAYS: Record<CalendarViewRange, number> = {
  semana: 7,
  quincena: 14,
  mes: 30,
};

type PmsTimelineCalendarProps = {
  reservations: Reservation[];
  range: CalendarViewRange;
  rangeStart: Date;
  selectedReservationId: string | null;
  onSelectReservation: (id: string) => void;
  propertyFilter?: PropertyId;
  /** Filas de unidad cuando no hay reservas (mantiene la grilla visible) */
  placeholderUnits?: PropertyUnit[];
  emptyOverlay?: ReactNode;
};

function groupUnits(units: PropertyUnit[]) {
  const groups: { propertyId: string; propertyName: string; units: PropertyUnit[] }[] = [];
  const seen = new Set<string>();
  for (const u of units) {
    if (!seen.has(u.propertyId)) {
      seen.add(u.propertyId);
      groups.push({
        propertyId: u.propertyId,
        propertyName: propertyName(u.propertyId),
        units: units.filter((x) => x.propertyId === u.propertyId),
      });
    }
  }
  return groups;
}

export function PmsTimelineCalendar({
  reservations,
  range,
  rangeStart,
  selectedReservationId,
  onSelectReservation,
  propertyFilter = "all",
  placeholderUnits,
  emptyOverlay,
}: PmsTimelineCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayCount = VIEW_DAYS[range];
  const days = useMemo(
    () => generateDateRange(rangeStart, dayCount),
    [rangeStart, dayCount]
  );
  const timelineWidth = dayCount * DAY_WIDTH;

  const units = useMemo(() => {
    let list = unitsFromReservations(reservations);
    if (list.length === 0 && placeholderUnits?.length) {
      list = placeholderUnits;
    }
    if (propertyFilter !== "all") {
      list = list.filter((u) => u.propertyId === propertyFilter);
    }
    return list;
  }, [propertyFilter, reservations, placeholderUnits]);

  const hasReservations = reservations.length > 0;

  const groups = groupUnits(units);

  const reservationsByUnit = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    units.forEach((u) => {
      map[u.id] = reservations.filter((r) => r.unitId === u.id);
    });
    return map;
  }, [reservations, units]);

  return (
    <div className="ci-surface overflow-hidden border-border/70/80">
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="relative" style={{ minWidth: UNIT_COL_WIDTH + timelineWidth }}>
          <div className="sticky top-0 z-20 flex border-b border-border/70 bg-muted/95 backdrop-blur-sm">
            <div
              className="sticky left-0 z-30 shrink-0 border-r border-border/70 bg-muted px-3 py-2.5"
              style={{ width: UNIT_COL_WIDTH }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Unidad
              </span>
            </div>
            <div className="flex" style={{ width: timelineWidth }}>
              {days.map((d) => {
                const { day, weekday, isToday } = formatDayHeader(d);
                return (
                  <div
                    key={d.toISOString()}
                    style={{ width: DAY_WIDTH }}
                    className={cn(
                      "shrink-0 border-r border-border/70/80 px-1 py-2 text-center",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <p className="text-[10px] uppercase text-muted-foreground">{weekday}</p>
                    <p
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        isToday ? "text-primary" : "text-foreground"
                      )}
                    >
                      {day}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.propertyId} className="relative">
              <div
                className="sticky left-0 z-10 border-b border-border/70 bg-sand/60 px-3 py-1.5 text-xs font-bold text-foreground"
                style={{ width: "100%" }}
              >
                {group.propertyName}
              </div>
              {group.units.map((unit) => {
                const unitRes = reservationsByUnit[unit.id] ?? [];
                return (
                  <div
                    key={unit.id}
                    className="flex border-b border-border/50 hover:bg-sand/60/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-3"
                      style={{ width: UNIT_COL_WIDTH }}
                    >
                      <span className="text-xs font-semibold text-foreground">{unit.name}</span>
                      <span className="text-[10px] text-muted-foreground">{unit.shortLabel}</span>
                    </div>
                    <div
                      className="relative shrink-0"
                      style={{ width: timelineWidth, height: ROW_HEIGHT }}
                    >
                      {days.map((d, i) => (
                        <motion.div
                          key={i}
                          className="absolute top-0 bottom-0 border-r border-border/50/80"
                          style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      ))}
                      {unitRes.map((res) => {
                        const bar = reservationBarStyle(res, rangeStart, dayCount);
                        if (!bar) return null;
                        const style = platformTimelineStyles[res.platform];
                        const selected = selectedReservationId === res.id;
                        return (
                          <motion.button
                            key={res.id}
                            type="button"
                            initial={false}
                            whileHover={{ scale: 1.02, zIndex: 5 }}
                            onClick={() => onSelectReservation(res.id)}
                            className={cn(
                              "absolute top-1.5 flex h-[calc(100%-12px)] min-w-[24px] flex-col justify-center overflow-hidden rounded-md border px-1.5 text-left shadow-sm transition-shadow",
                              selected && "ring-2 ring-primary ring-offset-1"
                            )}
                            style={{
                              left: bar.left,
                              width: bar.width,
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.text,
                            }}
                            title={`${res.guestName} · ${res.platform}`}
                          >
                            <span className="truncate text-[11px] font-semibold leading-tight">
                              {res.guestName}
                            </span>
                            {bar.width > 70 && (
                              <span className="truncate text-[9px] opacity-90">
                                {res.platform}
                                {res.guestCount > 1 ? ` · ${res.guestCount}p` : ""}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {!hasReservations && emptyOverlay && (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              style={{ left: UNIT_COL_WIDTH }}
            >
              <div className="pointer-events-auto mx-4 max-w-md rounded-2xl border border-border/60 bg-card/95 px-6 py-5 text-center shadow-[0_8px_32px_-12px_rgba(62,79,60,0.12)] backdrop-blur-sm">
                {emptyOverlay}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border/70 bg-sand/60/80 px-4 py-2.5">
        {Object.entries(platformTimelineStyles).map(([platform, s]) => (
          <span key={platform} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-sm border"
              style={{ backgroundColor: s.bg, borderColor: s.border }}
            />
            {platform}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Una unidad = una reserva por día
        </span>
      </div>
    </div>
  );
}

export function getDefaultRangeStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
