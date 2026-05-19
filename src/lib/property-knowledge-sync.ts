import { upsertKnowledgeItem } from "@/lib/db/mutations";
import type { Property } from "@/types";
import type { KnowledgeCategory, KnowledgeStatus } from "@/lib/supabase/types";

function kbStatus(content: string): KnowledgeStatus {
  const t = content.trim();
  if (t.length >= 12) return "completo";
  if (t.length > 0) return "incompleto";
  return "faltante";
}

export async function syncPropertyKnowledgeFromProperty(
  propertyDbId: string,
  input: Partial<Property> & { checkOutNotes?: string }
) {
  const wifiParts = [input.wifiName, input.wifiPassword ? `clave: ${input.wifiPassword}` : ""]
    .filter(Boolean)
    .join(" · ");

  const checkInContent = [
    input.checkInTime ? `Horario: ${input.checkInTime}` : "",
    input.checkInInstructions ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const checkOutContent = [
    input.checkOutTime ? `Horario: ${input.checkOutTime}` : "",
    input.checkOutNotes ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const items: { category: KnowledgeCategory; title: string; content: string }[] = [
    { category: "wifi", title: "WiFi", content: wifiParts },
    { category: "check_in", title: "Check-in", content: checkInContent },
    { category: "check_out", title: "Check-out", content: checkOutContent },
    { category: "parking", title: "Estacionamiento", content: input.parkingInfo ?? "" },
    { category: "pets", title: "Mascotas", content: input.petPolicy ?? "" },
    { category: "house_rules", title: "Reglas de la casa", content: input.houseRules ?? "" },
    {
      category: "lock_instructions",
      title: "Cerradura",
      content: input.lockInstructions ?? "",
    },
    { category: "emergency", title: "Emergencias", content: input.emergencyContact ?? "" },
  ];

  await Promise.all(
    items.map((item) =>
      upsertKnowledgeItem({
        propertyDbId,
        category: item.category,
        title: item.title,
        content: item.content || undefined,
        status: kbStatus(item.content),
      })
    )
  );
}
