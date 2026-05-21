/** Facts extracted from guest messages — persisted on conversations.guest_context */

export type ConversationGuestContext = {
  check_in?: string;
  check_out?: string;
  guests_count?: number;
  pets?: boolean | string;
  property_interest?: string;
  notes?: string[];
  updated_at?: string;
};

const MONTHS_ES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function normalizeDate(day: number, month: number, year?: number): string | undefined {
  const y = year ?? new Date().getFullYear();
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Extract stay dates and guest details from Spanish free text */
export function extractEntitiesFromText(text: string): Partial<ConversationGuestContext> {
  const t = text.toLowerCase().trim();
  const out: Partial<ConversationGuestContext> = {};

  const rangeDel =
    /(?:del|de)\s+(\d{1,2})\s+(?:al|a|hasta)\s+(?:el\s+)?(\d{1,2})(?:\s+de\s+(\w+))?/i;
  const mDel = t.match(rangeDel);
  if (mDel) {
    const d1 = Number(mDel[1]);
    const d2 = Number(mDel[2]);
    const monthWord = mDel[3]?.toLowerCase();
    const month = monthWord ? MONTHS_ES[monthWord] : new Date().getMonth() + 1;
    const ci = normalizeDate(d1, month);
    const co = normalizeDate(d2, month);
    if (ci) out.check_in = ci;
    if (co) out.check_out = co;
  }

  const isoRange = t.match(
    /(\d{4}-\d{2}-\d{2})\s*(?:al|a|-|hasta)\s*(\d{4}-\d{2}-\d{2})/
  );
  if (isoRange) {
    out.check_in = isoRange[1];
    out.check_out = isoRange[2];
  }

  const slashRange = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\s*(?:al|a|-)\s*(\d{1,2})[\/\-](\d{1,2})/);
  if (slashRange && !out.check_in) {
    const m1 = Number(slashRange[2]);
    const d1 = Number(slashRange[1]);
    const d2 = Number(slashRange[4]);
    const y = slashRange[3] ? Number(slashRange[3].length === 2 ? `20${slashRange[3]}` : slashRange[3]) : undefined;
    const ci = normalizeDate(d1, m1, y);
    const co = normalizeDate(d2, m1, y);
    if (ci) out.check_in = ci;
    if (co) out.check_out = co;
  }

  const guestsMatch = t.match(
    /(\d+)\s*(?:personas?|hu[eé]spedes?|adultos?|gente)|(?:somos|ser[ií]amos|vamos)\s+(\d+)/
  );
  if (guestsMatch) {
    const n = Number(guestsMatch[1] ?? guestsMatch[2]);
    if (n > 0 && n < 30) out.guests_count = n;
  }

  if (/mascota|perro|gato|pet/i.test(t)) {
    out.pets = /no\s+(acept|permit)|sin\s+mascota/i.test(t) ? false : true;
  }

  return out;
}

export function mergeGuestContext(
  prev: ConversationGuestContext | null | undefined,
  patch: Partial<ConversationGuestContext>
): ConversationGuestContext {
  const base = { ...(prev ?? {}) };
  if (patch.check_in) base.check_in = patch.check_in;
  if (patch.check_out) base.check_out = patch.check_out;
  if (patch.guests_count != null) base.guests_count = patch.guests_count;
  if (patch.pets !== undefined) base.pets = patch.pets;
  if (patch.property_interest) base.property_interest = patch.property_interest;
  base.updated_at = new Date().toISOString();
  return base;
}

export function formatGuestContextBlock(ctx: ConversationGuestContext | null | undefined): string {
  if (!ctx || Object.keys(ctx).length === 0) {
    return "(aún no se extrajeron datos del huésped en esta conversación)";
  }
  const lines: string[] = [];
  if (ctx.check_in) lines.push(`• Llegada mencionada: ${ctx.check_in}`);
  if (ctx.check_out) lines.push(`• Salida mencionada: ${ctx.check_out}`);
  if (ctx.guests_count) lines.push(`• Personas: ${ctx.guests_count}`);
  if (ctx.pets !== undefined) {
    lines.push(`• Mascotas: ${ctx.pets === true ? "sí" : ctx.pets === false ? "no" : ctx.pets}`);
  }
  if (ctx.property_interest) lines.push(`• Interés: ${ctx.property_interest}`);
  return lines.join("\n");
}

/** Merge entities from full message history (newest wins for conflicts) */
export function buildContextFromMessages(
  bodies: string[],
  existing?: ConversationGuestContext | null
): ConversationGuestContext {
  let ctx = { ...(existing ?? {}) };
  for (const body of bodies) {
    ctx = mergeGuestContext(ctx, extractEntitiesFromText(body));
  }
  return ctx;
}
