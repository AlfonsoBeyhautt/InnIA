import type { PropertyId } from "@/types";

export type NotificationCategory =
  | "mensaje"
  | "reserva"
  | "cerradura"
  | "operaciones"
  | "ia"
  | "pago"
  | "tarea";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: NotificationCategory;
  read: boolean;
  propertyId?: PropertyId;
  href?: string;
}

export const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Nuevo mensaje urgente de Lucía Fernández",
    description: "Problema con la cerradura en Apartamento La Paloma.",
    timestamp: "Hace 5 min",
    category: "mensaje",
    read: false,
    propertyId: "paloma",
    href: "/app/inbox",
  },
  {
    id: "n2",
    title: "Check-in confirmado en Casa Punta del Diablo",
    description: "Martín y familia ingresan hoy a las 15:00.",
    timestamp: "Hace 32 min",
    category: "reserva",
    read: false,
    propertyId: "pdd",
    href: "/app/reservas",
  },
  {
    id: "n3",
    title: "Cerradura offline en Apartamento La Paloma",
    description: "Sin conexión desde las 09:08. Requiere revisión.",
    timestamp: "Hace 1 h",
    category: "cerradura",
    read: false,
    propertyId: "paloma",
    href: "/app/cerraduras",
  },
  {
    id: "n4",
    title: "Limpieza completada por María L.",
    description: "Cabaña Rocha lista para próxima estadía.",
    timestamp: "Hace 2 h",
    category: "operaciones",
    read: true,
    propertyId: "rocha",
    href: "/app/operaciones",
  },
  {
    id: "n5",
    title: "La IA creó una respuesta automática sugerida",
    description: "Plantilla sobre estacionamiento lista para revisar.",
    timestamp: "Hace 3 h",
    category: "ia",
    read: true,
    href: "/app/reportes",
  },
  {
    id: "n6",
    title: "Pago recibido desde Booking",
    description: "US$420 por estadía de Lucía Fernández.",
    timestamp: "Ayer",
    category: "pago",
    read: true,
    propertyId: "paloma",
    href: "/app/finanzas",
  },
  {
    id: "n7",
    title: "Tarea de mantenimiento vencida",
    description: "Revisión de cerradura en La Paloma sin completar.",
    timestamp: "Ayer",
    category: "tarea",
    read: true,
    propertyId: "paloma",
    href: "/app/operaciones",
  },
];

export const categoryLabels: Record<NotificationCategory, string> = {
  mensaje: "Mensaje",
  reserva: "Reserva",
  cerradura: "Cerradura",
  operaciones: "Operaciones",
  ia: "IA",
  pago: "Pago",
  tarea: "Tarea",
};
