"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn, platformBlockStyles, propertyAbbrev } from "@/lib/utils";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import type { Reservation } from "@/types";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const mayDays = Array.from({ length: 14 }, (_, i) => i + 15);

type ReservationCalendarProps = {
  reservations: Reservation[];
  selectedDay: number | null;
  selectedReservationId: string | null;
  onSelectDay: (day: number) => void;
  onSelectReservation: (id: string) => void;
};

function reservationOnDay(r: Reservation, day: number) {
  const d = String(day);
  return (
    r.checkIn.includes(d) ||
    r.checkOut.includes(d) ||
    (parseInt(r.checkIn.split("-")[2] || "0", 10) <= day &&
      parseInt(r.checkOut.split("-")[2] || "99", 10) >= day)
  );
}

export function ReservationCalendar({
  reservations,
  selectedDay,
  selectedReservationId,
  onSelectDay,
  onSelectReservation,
}: ReservationCalendarProps) {
  const byDay = useMemo(() => {
    const map: Record<number, Reservation[]> = {};
    mayDays.forEach((day) => {
      map[day] = reservations.filter((r) => reservationOnDay(r, day));
    });
    return map;
  }, [reservations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ci-surface overflow-hidden border-primary/12 p-4 sm:p-5"
    >
      <motion.div className="mb-4 flex items-center justify-between border-b border-primary/10 pb-3">
        <h3 className="ci-section-title text-base">Mayo 2026</h3>
        <span className="text-xs font-medium text-primary/70">Vista mes</span>
      </motion.div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-primary/70">
        {days.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {mayDays.map((day) => {
          const dayRes = byDay[day] ?? [];
          const isSelected = selectedDay === day;
          const isToday = day === 17;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[96px] rounded-xl border p-1.5 text-left transition-all",
                isToday && !isSelected && "border-primary/35 bg-sand/50",
                isSelected
                  ? "border-primary bg-primary/8 shadow-md ring-2 ring-primary/25"
                  : "border-border/70 bg-card hover:border-primary/25 hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold",
                  isToday && "bg-primary text-primary-foreground shadow-sm",
                  !isToday && "text-foreground"
                )}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1">
                {dayRes.slice(0, 2).map((r) => (
                  <motion.div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    whileHover={{ scale: 1.02, y: -1 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReservation(r.id);
                      onSelectDay(day);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onSelectReservation(r.id);
                      }
                    }}
                    className={cn(
                      "w-full cursor-pointer rounded-lg border px-1.5 py-1.5 text-left text-[10px] leading-tight shadow-sm",
                      platformBlockStyles[r.platform],
                      selectedReservationId === r.id && "ring-2 ring-primary shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4 border border-white/60">
                        <AvatarFallback className="text-[7px]">
                          {getInitials(r.guestName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-semibold">{r.guestName.split(" ")[0]}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-0.5">
                      <span className="truncate opacity-80">{propertyAbbrev(r.propertyId)}</span>
                      <PlatformBadge platform={r.platform} className="origin-right scale-[0.65]" />
                    </div>
                  </motion.div>
                ))}
                {dayRes.length > 2 && (
                  <span className="block px-1 text-[10px] font-medium text-primary/70">
                    +{dayRes.length - 2} más
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
