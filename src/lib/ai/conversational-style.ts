import type { Message } from "@/types";

/** Only greet on first exchange or after long silence */
export function shouldUseGreeting(recentMessages: Message[]): boolean {
  const guestMsgs = recentMessages.filter((m) => m.sender === "guest");
  const aiOrOwner = recentMessages.filter((m) => m.sender !== "guest");
  if (guestMsgs.length <= 1 && aiOrOwner.length === 0) return true;
  if (recentMessages.length === 0) return true;

  const lastOutbound = [...recentMessages]
    .reverse()
    .find((m) => m.sender === "ai" || m.sender === "owner");
  if (!lastOutbound) return true;

  return false;
}

/** Strip repetitive "Hola Nombre," openings when not appropriate */
export function polishGeneratedResponse(
  text: string,
  options: { guestName?: string; allowGreeting: boolean }
): string {
  let out = text.trim();
  if (!out) return out;

  const name = options.guestName?.trim();
  if (!options.allowGreeting && name) {
    const patterns = [
      new RegExp(`^hola\\s+${escapeReg(name)}[,!.\\s]*`, "i"),
      new RegExp(`^buen(?:os|as)\\s+(?:d[ií]as|tardes|noches)[,.\\s]*${escapeReg(name)}?[,!.\\s]*`, "i"),
      new RegExp(`^hola[,!.\\s]*`, "i"),
    ];
    for (const p of patterns) {
      out = out.replace(p, "").trim();
    }
  }

  out = out
    .replace(/\b(?:la propiedad|el alojamiento|el establecimiento)\s+[\wáéíóúñ]+\s+(?:tiene|cuenta|ofrece)/gi, (m) =>
      m.replace(/^(?:la propiedad|el alojamiento|el establecimiento)\s+[\wáéíóúñ]+\s+/i, "Tenemos ")
    )
    .replace(/\bsegún la información disponible\b/gi, "")
    .replace(/\bde acuerdo a (?:la|nuestra) información\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (out && !/[.!?]$/.test(out) && out.length > 80) {
    out += ".";
  }

  return out;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getChannelStyleHint(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("whatsapp") || p === "instagram") {
    return `CANAL: ${platform} — mensaje corto de chat móvil (como WhatsApp). Máximo 1-3 oraciones. Sin párrafos largos ni formato email.`;
  }
  return `CANAL: ${platform} — tono de mensajería directa, breve y humana.`;
}
