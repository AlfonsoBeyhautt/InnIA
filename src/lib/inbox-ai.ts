import { knowledgeBaseItems, properties, reservations } from "@/data/mock";
import type { Conversation, PropertyId } from "@/types";
import type { AiAnalysis, AiResponseStatus } from "@/types/inbox-ai";

type Intent =
  | "estacionamiento"
  | "mascotas"
  | "check-in"
  | "check-out"
  | "wifi"
  | "cerradura"
  | "parrillero"
  | "factura"
  | "reglas"
  | "general";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/estacionamiento|parking|estacionar|auto|coche/.test(t)) return "estacionamiento";
  if (/mascota|perro|gato|pet/.test(t)) return "mascotas";
  if (/check-?in|ingreso|llegar|entrada|hora.*lleg/.test(t)) return "check-in";
  if (/check-?out|salida|retir/.test(t)) return "check-out";
  if (/wifi|internet|contraseña.*red/.test(t)) return "wifi";
  if (/cerradura|código|codigo|llave|puerta|no abre/.test(t)) return "cerradura";
  if (/parrillero|parrilla|asado|bbq/.test(t)) return "parrillero";
  if (/factura|rut|comprobante|recibo fiscal/.test(t)) return "factura";
  if (/regla|norma|prohibido|fiesta|ruido/.test(t)) return "reglas";
  return "general";
}

function kbStatus(topic: string): "completo" | "incompleto" | "faltante" {
  const item = knowledgeBaseItems.find((k) =>
    k.topic.toLowerCase().includes(topic.toLowerCase())
  );
  return item?.status ?? "faltante";
}

function buildAnalysis(
  intent: Intent,
  propertyId: PropertyId,
  guestMessage: string,
  conversation: Conversation
): AiAnalysis {
  const property = properties.find((p) => p.id === propertyId);
  const reservation = reservations.find((r) => r.id === conversation.reservationId);
  const sourcesUsed: string[] = [];
  const missingTopics: string[] = [];

  if (!property) {
    return {
      status: "insufficient_info",
      suggestedResponse: "",
      sourcesUsed: [],
      missingTopics: ["Información de la propiedad"],
      reason: "No se encontró la propiedad asociada a esta conversación.",
      canAutoSend: false,
      detectedIntent: intent,
    };
  }

  if (intent === "cerradura" || conversation.labels.includes("Problema mantenimiento")) {
    return {
      status: "needs_review",
      suggestedResponse:
        "Hola, lamentamos el inconveniente con la cerradura. Un técnico está coordinando la solución y te enviaremos un código actualizado en breve.",
      sourcesUsed: ["Instrucciones de check-in", "Estado de cerradura inteligente"],
      missingTopics: [],
      reason:
        "Problemas de cerradura o acceso requieren revisión humana por seguridad del huésped.",
      canAutoSend: false,
      detectedIntent: intent,
    };
  }

  if (intent === "factura") {
    return {
      status: "needs_review",
      suggestedResponse:
        "Hola, con gusto te enviamos la factura. Confirmame el RUT o razón social y te la hacemos llegar por email.",
      sourcesUsed: ["Datos de la reserva"],
      missingTopics: [],
      reason: "Las solicitudes de facturación requieren validación del dueño.",
      canAutoSend: false,
      detectedIntent: intent,
    };
  }

  if (intent === "estacionamiento") {
    const kb = kbStatus("estacionamiento");
    if (kb === "faltante" || kb === "incompleto") {
      return {
        status: "insufficient_info",
        suggestedResponse: "",
        sourcesUsed: [],
        missingTopics: [
          "No hay información cargada sobre estacionamiento para esta propiedad.",
        ],
        reason:
          "El huésped preguntó por estacionamiento pero la base de conocimiento no tiene ese dato completo.",
        canAutoSend: false,
        detectedIntent: intent,
      };
    }
  }

  let suggestedResponse = "";
  let canAutoSend = false;

  switch (intent) {
    case "mascotas": {
      if (property.houseRules?.toLowerCase().includes("mascota")) {
        sourcesUsed.push("Reglas de la casa", "Base de conocimiento · Mascotas");
        suggestedResponse = `Hola, gracias por escribir. ${property.houseRules.includes("Mascotas") ? property.houseRules.match(/[Mm]ascotas[^.]+\./)?.[0] ?? "Las mascotas están permitidas con aviso previo según nuestras reglas." : "Consultá nuestras reglas de mascotas en la guía de la propiedad."}`;
        canAutoSend = kbStatus("mascotas") === "completo" || property.houseRules.length > 20;
      } else {
        missingTopics.push("Política de mascotas no definida en la propiedad.");
      }
      break;
    }
    case "check-in": {
      sourcesUsed.push("Instrucciones de check-in", "Datos de la reserva");
      const checkIn = reservation?.checkIn ?? "tu fecha de llegada";
      suggestedResponse = `¡Hola! El check-in es a partir de las 15:00 (${checkIn}). ${property.checkInInstructions ?? "Te enviaremos el código de acceso 24 h antes."}`;
      canAutoSend = true;
      break;
    }
    case "check-out": {
      sourcesUsed.push("Instrucciones de check-out");
      suggestedResponse = `Hola, el check-out es a las 10:00. ${property.checkOutInstructions ?? "Por favor dejá las llaves en el lugar indicado en la guía."}`;
      canAutoSend = true;
      break;
    }
    case "wifi": {
      if (property.wifi && kbStatus("WiFi") === "completo") {
        sourcesUsed.push("WiFi de la propiedad");
        suggestedResponse = `¡Hola! Los datos de WiFi son: ${property.wifi}.`;
        canAutoSend = true;
      } else {
        missingTopics.push("Credenciales WiFi no cargadas.");
      }
      break;
    }
    case "parrillero": {
      if (property.houseRules?.toLowerCase().includes("parrill")) {
        sourcesUsed.push("Reglas de la casa");
        suggestedResponse =
          "¡Hola! Sí, el parrillero está disponible hasta las 22:00. Encontrarás carbón en el galpón.";
        canAutoSend = true;
      } else {
        missingTopics.push("Información sobre parrillero / amenities exteriores.");
      }
      break;
    }
    case "estacionamiento": {
      sourcesUsed.push("Base de conocimiento · Estacionamiento");
      suggestedResponse =
        "¡Hola! Sí, hay estacionamiento gratuito a aproximadamente 2 cuadras de la propiedad. Te envío la ubicación exacta por mensaje.";
      canAutoSend = true;
      break;
    }
    case "reglas": {
      sourcesUsed.push("Reglas de la casa");
      suggestedResponse = `Hola, estas son nuestras reglas principales: ${property.houseRules ?? "Consultá la guía enviada al confirmar la reserva."}`;
      canAutoSend = !!property.houseRules;
      break;
    }
    default: {
      sourcesUsed.push("Información general de la propiedad");
      suggestedResponse = `¡Hola! Gracias por tu mensaje. Estoy revisando tu consulta sobre ${property.name}. ¿Podés darme un poco más de detalle para ayudarte mejor?`;
      canAutoSend = false;
    }
  }

  if (missingTopics.length > 0) {
    return {
      status: "insufficient_info",
      suggestedResponse: suggestedResponse || "",
      sourcesUsed,
      missingTopics,
      reason: `Información insuficiente para responder con seguridad sobre: ${missingTopics.join(" ")}`,
      canAutoSend: false,
      detectedIntent: intent,
    };
  }

  if (!canAutoSend && !suggestedResponse) {
    return {
      status: "needs_review",
      suggestedResponse:
        "¡Hola! Recibimos tu mensaje y un miembro del equipo te responderá en breve.",
      sourcesUsed,
      missingTopics: [],
      reason: "La consulta necesita criterio humano antes de enviar.",
      canAutoSend: false,
      detectedIntent: intent,
    };
  }

  const status: AiResponseStatus = canAutoSend ? "auto_sent" : "needs_review";

  return {
    status,
    suggestedResponse,
    sourcesUsed,
    missingTopics: [],
    reason: canAutoSend
      ? "La IA encontró información suficiente en la propiedad y la reserva para responder automáticamente."
      : "Respuesta generada, pero requiere tu revisión antes de enviar.",
    canAutoSend,
    detectedIntent: intent,
  };
}

export function analyzeGuestMessage(conversation: Conversation): AiAnalysis {
  const guestMessages = conversation.messages.filter((m) => m.sender === "guest");
  const lastGuest = guestMessages[guestMessages.length - 1];
  const text = lastGuest?.content ?? conversation.lastMessage;
  const intent = detectIntent(text);
  return buildAnalysis(intent, conversation.propertyId, text, conversation);
}

export function formatTimestamp() {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}
