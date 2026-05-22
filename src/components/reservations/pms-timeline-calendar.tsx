"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { motion } from "framer-motion";
import { cn, propertyName } from "@/lib/utils";
import type { PropertyId } from "@/types";
import type { Reservation } from "@/types";
import {
  unitsFromReservations,
  type PropertyUnit,
} from "@/lib/property-units";
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

const MOBILE_DAY_MIN = 36;
const MOBILE_DAY_MAX = 44;
const DESKTOP_DAY_MAX = 96;

type PmsTimelineCalendarProps = {
  reservations: Reservation[];
  range: CalendarViewRange;
  rangeStart: Date;
  selectedReservationId: string | null;
  onSelectReservation: (id: string) => void;
  propertyFilter?: PropertyId;
  /** Filas de unidad cuando no hay reservas (mantiene la grilla visible) */
  placeholderUnits?: PropertyUnit[];
  /** Banner informativo (no tapa la grilla) cuando no hay reservas */
  emptyBanner?: ReactNode;
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

function useContainerWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setWidth(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

export function PmsTimelineCalendar({
  reservations,
  range,
  rangeStart,
  selectedReservationId,
  onSelectReservation,
  propertyFilter = "all",
  placeholderUnits,
  emptyBanner,
}: PmsTimelineCalendarProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const isCompact = useMediaQuery("(max-width: 1023px)");
  const bodyWidth = useContainerWidth(bodyRef);

  const unitColWidth = isCompact ? 132 : UNIT_COL_WIDTH;
  const rowHeight = isCompact ? 48 : 56;
  const dayCount = VIEW_DAYS[range];
  const days = useMemo(
    () => generateDateRange(rangeStart, dayCount),
    [rangeStart, dayCount]
  );

  const dayWidth = useMemo(() => {
    const available = Math.max(0, bodyWidth - unitColWidth);
    if (available <= 0) return isCompact ? MOBILE_DAY_MIN : DAY_WIDTH;

    const distributed = Math.floor(available / dayCount);
    if (isCompact) {
      return Math.min(MOBILE_DAY_MAX, Math.max(MOBILE_DAY_MIN, distributed));
    }
    return Math.min(DESKTOP_DAY_MAX, Math.max(DAY_WIDTH, distributed));
  }, [bodyWidth, unitColWidth, dayCount, isCompact]);

  const timelineWidth = dayCount * dayWidth;
  const gridMinWidth = unitColWidth + timelineWidth;

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-border/80 bg-card shadow-[0_4px_24px_-8px_rgba(62,79,60,0.12)] max-lg:rounded-2xl max-lg:shadow-sm">
      {!hasReservations && emptyBanner && (
        <div className="shrink-0 border-b border-border/70 bg-sand/50 px-4 py-3 max-lg:px-3 max-lg:py-2.5">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            {emptyBanner}
          </div>
        </div>
      )}

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className="relative flex min-h-full flex-col"
          style={{ minWidth: gridMinWidth }}
        >
          <div className="sticky top-0 z-20 flex shrink-0 border-b border-border/70 bg-muted/95 backdrop-blur-sm">
            <div
              className="sticky left-0 z-30 flex shrink-0 items-center border-r border-border/70 bg-muted px-3"
              style={{ width: unitColWidth, minHeight: rowHeight }}
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
                    style={{ width: dayWidth, minHeight: rowHeight }}
                    className={cn(
                      "flex shrink-0 flex-col items-center justify-center border-r border-border/70/80 px-1",
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

          <div className="flex min-h-0 flex-1 flex-col">
            {groups.map((group) => (
              <div key={group.propertyId} className="relative shrink-0">
                <div
                  className="sticky left-0 z-10 border-b border-border/70 bg-sand/60 px-3 py-2 text-xs font-bold text-foreground"
                  style={{ width: "100%", minWidth: gridMinWidth }}
                >
                  {group.propertyName}
                </div>
                {group.units.map((unit) => {
                  const unitRes = reservationsByUnit[unit.id] ?? [];
                  return (
                    <div
                      key={unit.id}
                      className="flex shrink-0 border-b border-border/50 hover:bg-sand/60/50"
                      style={{ height: rowHeight, minWidth: gridMinWidth }}
                    >
                      <div
                        className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-3"
                        style={{ width: unitColWidth, height: rowHeight }}
                      >
                        <span className="text-xs font-semibold text-foreground">{unit.name}</span>
                        <span className="text-[10px] text-muted-foreground">{unit.shortLabel}</span>
                      </div>
                      <div
                        className="relative shrink-0"
                        style={{ width: timelineWidth, height: rowHeight }}
                      >
                        {days.map((d, i) => (
                          <motion.div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-border/50/80"
                            style={{ left: i * dayWidth, width: dayWidth }}
                          />
                        ))}
                        {unitRes.map((res) => {
                          const bar = reservationBarStyle(res, rangeStart, dayCount, dayWidth);
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

            {/* Relleno vertical: la grilla ocupa el alto disponible sin dejar vacío muerto */}
            <div
              className="flex min-h-[160px] flex-1 border-b border-border/40"
              style={{ minWidth: gridMinWidth }}
              aria-hidden
            >
              <div
                className="sticky left-0 shrink-0 border-r border-border/70 bg-sand/30"
                style={{ width: unitColWidth }}
              />
              <div
                className="relative flex-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(var(--day-w)-1px),rgba(224,216,202,0.45)_calc(var(--day-w)-1px),rgba(224,216,202,0.45)_var(--day-w))]"
                style={
                  {
                    width: timelineWidth,
                    ["--day-w" as string]: `${dayWidth}px`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/70 bg-sand/60/80 px-4 py-2.5 max-lg:px-3 max-lg:py-2 lg:gap-4">
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
