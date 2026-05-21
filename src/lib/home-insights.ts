import type { Conversation, OperationTask, Property, Reservation } from "@/types";

export type HomeInsightKind =
  | "resumen_dia"
  | "sugerencia_ia"
  | "comparacion_plataformas"
  | "oportunidad"
  | "alerta_operativa"
  | "rendimiento_semanal";

export type HomeInsight = {
  id: string;
  kind: HomeInsightKind;
  title: string;
  content: string;
  href?: string;
  ctaLabel?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinNextDays(dateStr: string, days: number): boolean {
  const d = parseIsoDate(dateStr);
  if (!d) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d >= start && d <= end;
}

function countByPlatform(conversations: Conversation[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of conversations) {
    map.set(c.platform, (map.get(c.platform) ?? 0) + 1);
  }
  return map;
}

function suggestKnowledgeGap(properties: Property[]): string | null {
  const scoped = properties.slice(0, 5);
  for (const p of scoped) {
    if (!p.petPolicy?.trim()) {
      return `Completá la política de mascotas en ${p.name} para que la IA responda consultas frecuentes.`;
    }
    if (!p.wifi?.trim() && !p.wifiPassword?.trim()) {
      return `Agregá los datos de WiFi en ${p.name} para respuestas automáticas más completas.`;
    }
    if (!p.parkingInfo?.trim()) {
      return `Cargá información de estacionamiento en ${p.name} para reducir preguntas repetidas.`;
    }
  }
  return null;
}

export function buildHomeInsights(input: {
  conversations: Conversation[];
  reservations: Reservation[];
  tasks: OperationTask[];
  properties: Property[];
  unitCount: number;
}): HomeInsight[] {
  const { conversations, reservations, tasks, properties, unitCount } = input;
  const today = todayIso();

  const newInquiries = conversations.filter((c) => c.intentCategory === "nueva_consulta");
  const pendingMessages = conversations.filter((c) => c.unread || c.urgency !== "normal");
  const checkInsToday = reservations.filter(
    (r) => r.checkIn === today && (r.status === "check-in" || r.status === "confirmada")
  ).length;
  const checkOutsToday = reservations.filter((r) => r.checkOut === today).length;

  const insights: HomeInsight[] = [];

  const resumenParts: string[] = [];
  if (newInquiries.length > 0) {
    resumenParts.push(
      `${newInquiries.length} consulta${newInquiries.length === 1 ? "" : "s"} nueva${newInquiries.length === 1 ? "" : "s"}`
    );
  }
  if (pendingMessages.length > 0) {
    resumenParts.push(
      `${pendingMessages.length} mensaje${pendingMessages.length === 1 ? "" : "s"} pendiente${pendingMessages.length === 1 ? "" : "s"}`
    );
  }
  if (checkInsToday > 0) {
    resumenParts.push(`${checkInsToday} check-in${checkInsToday === 1 ? "" : "s"} hoy`);
  } else if (checkOutsToday > 0) {
    resumenParts.push(`${checkOutsToday} check-out${checkOutsToday === 1 ? "" : "s"} hoy`);
  }

  insights.push({
    id: "resumen",
    kind: "resumen_dia",
    title: "Resumen del día",
    content:
      resumenParts.length > 0
        ? `Hoy tenés ${resumenParts.join(", ")}.`
        : "No hay consultas nuevas ni mensajes pendientes. No hay check-ins programados para hoy.",
    href: pendingMessages.length > 0 ? "/app/inbox" : undefined,
    ctaLabel: pendingMessages.length > 0 ? "Ver mensajes" : undefined,
  });

  const knowledgeTip = suggestKnowledgeGap(properties);
  insights.push({
    id: "sugerencia",
    kind: "sugerencia_ia",
    title: "Sugerencia IA",
    content:
      knowledgeTip ??
      (pendingMessages.length > 0
        ? "Revisá los mensajes pendientes: responder a tiempo mejora la conversión."
        : "Activá o revisá la base de conocimiento en Propiedades para habilitar más respuestas automáticas."),
    href: knowledgeTip ? "/app/propiedades" : "/app/configuracion",
    ctaLabel: knowledgeTip ? "Ir a propiedades" : "Configurar IA",
  });

  const platformCounts = countByPlatform(conversations);
  const ranked = [...platformCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length >= 2 && ranked[0][1] > 0) {
    const [top, second] = ranked;
    insights.push({
      id: "plataformas",
      kind: "comparacion_plataformas",
      title: "Comparación entre plataformas",
      content: `${top[0]} concentra más conversaciones (${top[1]}). ${second[0]} suma ${second[1]}.`,
    });
  } else if (ranked.length === 1 && ranked[0][1] > 0) {
    insights.push({
      id: "plataformas",
      kind: "comparacion_plataformas",
      title: "Comparación entre plataformas",
      content: `Por ahora tus conversaciones llegan por ${ranked[0][0]}. Conectá más canales para comparar rendimiento.`,
      href: "/app/configuracion",
      ctaLabel: "Conectar canales",
    });
  } else {
    insights.push({
      id: "plataformas",
      kind: "comparacion_plataformas",
      title: "Comparación entre plataformas",
      content:
        "Cuando recibas mensajes por distintos canales, verás aquí qué plataforma genera más consultas.",
      href: "/app/configuracion",
      ctaLabel: "Conectar canales",
    });
  }

  const followUps = conversations.filter(
    (c) => c.intentCategory === "nueva_consulta" && (c.unread || c.urgency !== "normal")
  );
  insights.push({
    id: "oportunidad",
    kind: "oportunidad",
    title: "Oportunidad detectada",
    content:
      followUps.length > 0
        ? `Hay ${followUps.length} consulta${followUps.length === 1 ? "" : "s"} sin seguimiento que podrían convertirse en reserva.`
        : "No hay consultas sin seguimiento detectadas en este momento.",
    href: followUps.length > 0 ? "/app/inbox" : undefined,
    ctaLabel: followUps.length > 0 ? "Abrir inbox" : undefined,
  });

  const urgentTasks = tasks.filter(
    (t) => t.status === "Problema detectado" || t.status === "Pendiente"
  );
  const problemTasks = tasks.filter((t) => t.status === "Problema detectado");
  insights.push({
    id: "operativo",
    kind: "alerta_operativa",
    title: problemTasks.length > 0 ? "Alerta operativa" : "Estado operativo",
    content:
      problemTasks.length > 0
        ? `${problemTasks.length} tarea${problemTasks.length === 1 ? "" : "s"} con problema detectado requiere${problemTasks.length === 1 ? "" : "n"} atención.`
        : urgentTasks.length > 0
          ? `${urgentTasks.length} tarea${urgentTasks.length === 1 ? "" : "s"} operativa${urgentTasks.length === 1 ? "" : "s"} pendiente${urgentTasks.length === 1 ? "" : "s"}.`
          : "No hay tareas urgentes pendientes.",
    href: urgentTasks.length > 0 ? "/app/operaciones" : undefined,
    ctaLabel: urgentTasks.length > 0 ? "Ver operaciones" : undefined,
  });

  const weekArrivals = reservations.filter((r) => isWithinNextDays(r.checkIn, 7)).length;
  const occupied = reservations.filter((r) => r.status === "check-in").length;
  const occupancyPct =
    unitCount > 0 ? Math.round((occupied / unitCount) * 100) : null;

  insights.push({
    id: "semanal",
    kind: "rendimiento_semanal",
    title: "Rendimiento semanal",
    content:
      reservations.length === 0
        ? "Sin reservas cargadas: sincronizá calendarios o creá reservas para ver ocupación y llegadas."
        : weekArrivals > 0
          ? `${weekArrivals} llegada${weekArrivals === 1 ? "" : "s"} en los próximos 7 días${occupancyPct != null ? ` · ocupación actual ${occupancyPct}%` : ""}.`
          : occupancyPct != null
            ? `Ocupación actual ${occupancyPct}% · sin check-ins programados en los próximos 7 días.`
            : "No hay check-ins en los próximos 7 días según tus reservas actuales.",
    href: reservations.length === 0 ? "/app/reservas" : "/app/reportes",
    ctaLabel: reservations.length === 0 ? "Ir a reservas" : "Ver reportes",
  });

  return insights;
}

export const INSIGHT_ACCENT: Record<
  HomeInsightKind,
  { bg: string; border: string; icon: string }
> = {
  resumen_dia: {
    bg: "bg-[#f3efe8]",
    border: "border-[#e4ddd0]",
    icon: "text-olive",
  },
  sugerencia_ia: {
    bg: "bg-[#eef3e8]",
    border: "border-[#d4dfc8]",
    icon: "text-primary",
  },
  comparacion_plataformas: {
    bg: "bg-cream",
    border: "border-border/70",
    icon: "text-muted-foreground",
  },
  oportunidad: {
    bg: "bg-[#faf6f0]",
    border: "border-terracotta/20",
    icon: "text-terracotta",
  },
  alerta_operativa: {
    bg: "bg-[#f8f0ec]",
    border: "border-terracotta/25",
    icon: "text-terracotta",
  },
  rendimiento_semanal: {
    bg: "bg-sand/60",
    border: "border-border/60",
    icon: "text-olive",
  },
};
