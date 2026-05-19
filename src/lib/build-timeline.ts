import type { Conversation, OperationTask, Reservation } from "@/types";
import { propertyName } from "@/lib/utils";
import type { PropertyId } from "@/types";

export type TimelineEventKind =
  | "mensaje-urgente"
  | "mensaje"
  | "check-in"
  | "check-out"
  | "limpieza"
  | "mantenimiento"
  | "ia"
  | "cerradura";

export type TimelinePriority = "alta" | "media" | "baja" | "info";

export type TimelineEvent = {
  id: string;
  time: string;
  sortKey: number;
  kind: TimelineEventKind;
  title: string;
  description: string;
  propertyLabel: string;
  propertyId: PropertyId;
  href: string;
  priority: TimelinePriority;
  priorityLabel: string;
};

function shortProperty(id: PropertyId) {
  const names: Record<string, string> = {
    pdd: "Casa Punta del Diablo",
    rocha: "Cabaña Rocha",
    paloma: "Apartamento La Paloma",
    all: "Todas las propiedades",
  };
  return names[id] ?? propertyName(id);
}

export type TimelineGroups = {
  ahora: TimelineEvent[];
  proximasHoras: TimelineEvent[];
  manana: TimelineEvent[];
};

export function buildTimelineEvents(
  conversations: Conversation[],
  reservations: Reservation[],
  tasks: OperationTask[]
): TimelineGroups {
  const ahora: TimelineEvent[] = [];
  const proximasHoras: TimelineEvent[] = [];
  const manana: TimelineEvent[] = [];

  conversations
    .filter((c) => c.unread || c.urgency !== "normal")
    .forEach((c) => {
      const urgent = c.urgency === "urgente";
      ahora.push({
        id: `msg-${c.id}`,
        time: c.lastMessageAt,
        sortKey: urgent ? 0 : 10,
        kind: urgent ? "mensaje-urgente" : "mensaje",
        title: urgent
          ? `Mensaje urgente de ${c.guestName}`
          : `Mensaje por revisar de ${c.guestName}`,
        description: c.lastMessage,
        propertyLabel: shortProperty(c.propertyId),
        propertyId: c.propertyId,
        href: "/app/inbox",
        priority: urgent ? "alta" : "media",
        priorityLabel: urgent ? "Urgente" : "Revisar",
      });
    });

  reservations
    .filter((r) => r.status === "check-in")
    .forEach((r) => {
      ahora.push({
        id: `ci-${r.id}`,
        time: "15:00",
        sortKey: 20,
        kind: "check-in",
        title: `Check-in de ${r.guestName}`,
        description: `Llegada programada · código de cerradura ${r.lockCodeStatus === "activo" ? "activo" : "pendiente"}`,
        propertyLabel: shortProperty(r.propertyId),
        propertyId: r.propertyId,
        href: "/app/reservas",
        priority: "media",
        priorityLabel: "Check-in hoy",
      });
    });

  tasks
    .filter((t) => t.status === "En curso" || t.status === "Problema detectado")
    .forEach((t) => {
      const urgent = t.status === "Problema detectado";
      ahora.push({
        id: `task-${t.id}`,
        time: t.dueDate,
        sortKey: urgent ? 5 : 25,
        kind: t.type === "limpieza" ? "limpieza" : "mantenimiento",
        title: t.title,
        description: `${t.assignee ?? "Sin asignar"} · vence ${t.dueDate}`,
        propertyLabel: shortProperty(t.propertyId),
        propertyId: t.propertyId,
        href: "/app/operaciones",
        priority: urgent ? "alta" : "media",
        priorityLabel: urgent ? "Problema" : "En curso",
      });
    });

  ahora.push({
    id: "lock-gen",
    time: "16:00",
    sortKey: 28,
    kind: "cerradura",
    title: "Código de cerradura generado",
    description: "Martín y familia · Casa Punta del Diablo",
    propertyLabel: shortProperty("pdd"),
    propertyId: "pdd",
    href: "/app/cerraduras",
    priority: "info",
    priorityLabel: "Automático",
  });

  ahora.push({
    id: "ia-parking",
    time: "10:33",
    sortKey: 35,
    kind: "ia",
    title: "IA respondió consulta sobre estacionamiento",
    description: "Martín y familia · Airbnb",
    propertyLabel: shortProperty("pdd"),
    propertyId: "pdd",
    href: "/app/inbox",
    priority: "info",
    priorityLabel: "IA activa",
  });

  reservations
    .filter((r) => r.status === "confirmada")
    .slice(0, 2)
    .forEach((r) => {
      proximasHoras.push({
        id: `ph-${r.id}`,
        time: "18:00",
        sortKey: 50,
        kind: "check-in",
        title: `Próximo check-in · ${r.guestName}`,
        description: `Confirmada vía ${r.platform}`,
        propertyLabel: shortProperty(r.propertyId),
        propertyId: r.propertyId,
        href: "/app/reservas",
        priority: "baja",
        priorityLabel: "Próximo",
      });
    });

  tasks
    .filter((t) => t.status === "Pendiente")
    .slice(0, 2)
    .forEach((t) => {
      proximasHoras.push({
        id: `ph-task-${t.id}`,
        time: t.dueDate,
        sortKey: 55,
        kind: t.type === "limpieza" ? "limpieza" : "mantenimiento",
        title: t.title,
        description: "Pendiente de asignación o inicio",
        propertyLabel: shortProperty(t.propertyId),
        propertyId: t.propertyId,
        href: "/app/operaciones",
        priority: "media",
        priorityLabel: "Pendiente",
      });
    });

  reservations
    .filter((r) => r.status === "pendiente" || r.checkOut.includes("20"))
    .slice(0, 2)
    .forEach((r) => {
      manana.push({
        id: `man-${r.id}`,
        time: "Mañana",
        sortKey: 70,
        kind: r.status === "check-out" ? "check-out" : "check-in",
        title:
          r.status === "check-out"
            ? `Check-out · ${r.guestName}`
            : `Check-in · ${r.guestName}`,
        description: `${r.checkIn} → ${r.checkOut}`,
        propertyLabel: shortProperty(r.propertyId),
        propertyId: r.propertyId,
        href: "/app/reservas",
        priority: "baja",
        priorityLabel: "Mañana",
      });
    });

  manana.push({
    id: "ia-summary",
    time: "Mañana",
    sortKey: 80,
    kind: "ia",
    title: "Resumen automático de actividad",
    description: "La IA preparará un resumen de mensajes y tareas",
    propertyLabel: "Todas las propiedades",
    propertyId: "all",
    href: "/app/reportes",
    priority: "info",
    priorityLabel: "Programado",
  });

  const sort = (a: TimelineEvent, b: TimelineEvent) => a.sortKey - b.sortKey;
  ahora.sort(sort);
  proximasHoras.sort(sort);
  manana.sort(sort);

  return { ahora, proximasHoras, manana };
}
