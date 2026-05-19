import type { PropertyId, Platform } from "@/types";

export const operationsActivityFeed = [
  {
    id: "oa1",
    text: "María completó limpieza en Casa Punta del Diablo.",
    time: "Hace 12 min",
    type: "limpieza" as const,
  },
  {
    id: "oa2",
    text: "La IA creó una tarea por check-out finalizado.",
    time: "Hace 45 min",
    type: "ia" as const,
  },
  {
    id: "oa3",
    text: "Técnico asignado a cerradura de La Paloma.",
    time: "Hace 1 h",
    type: "mantenimiento" as const,
  },
  {
    id: "oa4",
    text: "Checklist actualizado en Cabaña Rocha (4/6).",
    time: "Hace 2 h",
    type: "limpieza" as const,
  },
];

export const propertyProfitability = [
  {
    id: "pdd",
    name: "Casa Punta del Diablo",
    revenue: 3200,
    expenses: 890,
    occupancy: 82,
    margin: 72,
    trend: "+12%",
  },
  {
    id: "rocha",
    name: "Cabaña Rocha",
    revenue: 2800,
    expenses: 620,
    occupancy: 65,
    margin: 78,
    trend: "+5%",
  },
  {
    id: "paloma",
    name: "Apartamento La Paloma",
    revenue: 2420,
    expenses: 670,
    occupancy: 71,
    margin: 72,
    trend: "-3%",
  },
];

export const financeAiInsights: {
  id: string;
  text: string;
  propertyId?: PropertyId;
  platform?: Platform;
}[] = [
  {
    id: "fi1",
    text: "La Paloma tuvo menor margen por limpiezas extra.",
    propertyId: "paloma",
  },
  {
    id: "fi2",
    text: "Las reservas directas generaron 18% más margen.",
    platform: "Directa",
  },
  {
    id: "fi3",
    text: "Rocha mantiene buena ocupación pero gastos altos.",
    propertyId: "rocha",
  },
];
