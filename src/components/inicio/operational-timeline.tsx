"use client";

import type { TimelineGroups } from "@/lib/build-timeline";
import { TimelineEventRow } from "@/components/inicio/timeline-event";

function TimelineSection({
  label,
  events,
  startIndex,
}: {
  label: string;
  events: import("@/lib/build-timeline").TimelineEvent[];
  startIndex: number;
}) {
  if (events.length === 0) return null;
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <span className="h-px flex-1 bg-primary/20" />
        {label}
        <span className="h-px flex-1 bg-primary/20" />
      </h3>
      <ol className="relative space-y-0 border-l-2 border-primary/30 pl-8">
        {events.map((event, i) => (
          <TimelineEventRow key={event.id} event={event} index={startIndex + i} />
        ))}
      </ol>
    </section>
  );
}

export function OperationalTimeline({ ahora, proximasHoras, manana }: TimelineGroups) {
  const ahoraLen = ahora.length;
  const proxLen = proximasHoras.length;

  return (
    <div className="ci-surface border-primary/15 bg-gradient-to-b from-card to-sand/20 p-5 sm:p-6">
      <div className="mb-8 border-b border-primary/10 pb-4">
        <h2 className="ci-section-title">Tu día en InnIA</h2>
        <p className="ci-section-sub">Línea de tiempo operativa con prioridades claras</p>
      </div>
      <div className="space-y-10">
        <TimelineSection label="Ahora" events={ahora} startIndex={0} />
        <TimelineSection label="Próximas horas" events={proximasHoras} startIndex={ahoraLen} />
        <TimelineSection label="Mañana" events={manana} startIndex={ahoraLen + proxLen} />
      </div>
    </div>
  );
}
