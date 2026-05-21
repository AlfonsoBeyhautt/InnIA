import type { IntentCategory } from "@/types";

export function getCategoryPromptSuffix(category: IntentCategory): string {
  switch (category) {
    case "nueva_consulta":
      return `
CONTEXTO: NUEVA CONSULTA (sin reserva aún).
- Tono cercano de venta: "Tenemos lugar", "Te paso el precio".
- Mensaje CORTO. Si faltan fechas, pedilas en una línea sin repetir lo que ya dijo.
- NO preguntes de nuevo fechas que ya están en DATOS YA CONOCIDOS.`;
    case "huesped_activo":
      return `
CONTEXTO: HUÉSPED ACTIVO (en estadía o con reserva).
- Operativo y directo: "El código es…", "Check-in desde las 15".
- 1-2 oraciones. Urgencias → escalar_dueno.`;
    case "comercial":
      return `
CONTEXTO: PROPUESTA COMERCIAL (no es huésped ni consulta de reserva).
- Tono profesional B2B, no como anfitrión a huésped.
- NO uses auto_responder salvo respuesta neutra de recepción.
- decision debe ser "requiere_revision" salvo mensaje trivial.
- El dueño decidirá aceptar, rechazar o dejar pendiente.`;
    default:
      return `
CONTEXTO: Conversación general. Clasifica con cuidado y prioriza revisión humana si hay duda.`;
  }
}
