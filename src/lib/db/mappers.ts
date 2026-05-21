import type { Tables } from "@/lib/supabase/types";
import type {
  Conversation,
  ConversationLabel,
  IntentCategory,
  Guest,
  GuestIncident,
  GuestReservationHistory,
  GuestReview,
  KnowledgeBaseItem,
  Message,
  OperationTask,
  Platform,
  Property,
  PropertyId,
  Reservation,
  Unit,
  Urgency,
} from "@/types";

type DbProperty = Tables<"properties">;
type DbGuest = Tables<"guests">;
type DbReservation = Tables<"reservations"> & {
  guest?: { full_name: string } | null;
  property?: { slug: string } | null;
  unit?: { slug: string } | null;
};
type DbConversation = Tables<"conversations"> & {
  guest?: { full_name: string } | null;
  property?: { slug: string; name?: string } | null;
};
type DbMessage = Tables<"messages">;
type DbTask = Tables<"operation_tasks">;
type DbKb = Tables<"knowledge_base_items">;
type DbUnit = Tables<"units">;

const platformMap: Record<string, Platform> = {
  airbnb: "Airbnb",
  booking: "Booking",
  whatsapp: "WhatsApp",
  whatsapp_business: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
  directa: "Directa",
};

export function toPlatform(value: string | null | undefined): Platform {
  if (!value) return "Directa";
  const key = value.toLowerCase();
  if (platformMap[key]) return platformMap[key];
  const found = (
    ["Airbnb", "Booking", "WhatsApp", "Instagram", "Email", "Directa"] as Platform[]
  ).find(
    (p) => p.toLowerCase() === key
  );
  return found ?? "Directa";
}

export function mapProperty(row: DbProperty): Property {
  const slug = row.slug as PropertyId;
  const wifi =
    row.wifi_name && row.wifi_password
      ? `${row.wifi_name} · clave: ${row.wifi_password}`
      : row.wifi_name ?? undefined;

  return {
    id: slug,
    dbId: row.id,
    slug,
    name: row.name,
    location: row.location,
    image: row.image_url ?? "/placeholder-property.jpg",
    status: row.status as Property["status"],
    occupancy: row.occupancy,
    platforms: row.platforms.map((p) => toPlatform(p)),
    smartLockOnline: row.smart_lock_online,
    wifi,
    houseRules: row.house_rules ?? undefined,
    checkInInstructions: row.arrival_instructions ?? undefined,
    checkOutInstructions: row.check_out_time
      ? `Check-out ${row.check_out_time}`
      : undefined,
    description: row.description ?? undefined,
    parkingInfo: row.parking_info ?? undefined,
    petPolicy: row.pet_policy ?? undefined,
    lockInstructions: row.lock_instructions ?? undefined,
    emergencyContact: row.emergency_contact ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
    checkInTime: row.check_in_time ?? undefined,
    checkOutTime: row.check_out_time ?? undefined,
    wifiName: row.wifi_name ?? undefined,
    wifiPassword: row.wifi_password ?? undefined,
  };
}

export function mapGuest(
  row: DbGuest,
  reservationHistory: GuestReservationHistory[] = []
): Guest {
  const prefs = Array.isArray(row.preferences)
    ? (row.preferences as string[])
    : [];
  const incidents = (row.incidents as unknown as GuestIncident[]) ?? [];
  const reviews = (row.reviews as unknown as GuestReview[]) ?? [];
  const rental = row.rental_data as unknown as Guest["rentalData"] | null;

  return {
    id: row.id,
    name: row.full_name.split(" ")[0] ?? row.full_name,
    fullName: row.full_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    documentId: row.document_number ?? undefined,
    documentType: row.document_type ?? undefined,
    passportNumber: row.passport_number ?? undefined,
    nationality: row.nationality ?? undefined,
    originPlatform: row.origin_platform ? toPlatform(row.origin_platform) : undefined,
    tags: row.tags ?? [],
    preferences: prefs,
    internalNotes: row.internal_notes ?? undefined,
    observations: row.observations ?? undefined,
    validationStatus: row.validation_status as Guest["validationStatus"],
    marketingConsent: row.marketing_consent,
    preferredPropertyId: (row.preferred_property_slug as PropertyId) ?? undefined,
    totalStays: reservationHistory.length,
    lastStay: reservationHistory[0]?.checkIn,
    reservationHistory,
    paymentsTotal: reservationHistory.reduce((s, r) => s + r.amount, 0),
    incidents,
    reviews,
    rentalData: rental ?? undefined,
  };
}

export function mapReservation(row: DbReservation): Reservation {
  const propertySlug = (row.property?.slug ?? row.property_id) as PropertyId;
  const unitSlug = row.unit?.slug ?? row.unit_id;

  return {
    id: row.id,
    propertyId: propertySlug,
    propertyDbId: row.property_id,
    unitId: unitSlug,
    unitDbId: row.unit_id,
    guestId: row.guest_id,
    guestName: row.guest?.full_name ?? "Huésped",
    guestCount: row.guests_count,
    platform: toPlatform(row.platform),
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status as Reservation["status"],
    paymentStatus: row.payment_status as Reservation["paymentStatus"],
    lockCodeStatus: (row.lock_code_status ?? "pendiente") as Reservation["lockCodeStatus"],
    amount: Number(row.total_amount),
    blocked: row.blocked,
    maintenance: row.maintenance,
  };
}

function mapUrgency(priority: string): Urgency {
  if (priority === "urgente") return "urgente";
  if (priority === "revisar") return "revisar";
  return "normal";
}

export function mapMessage(row: DbMessage): Message {
  const sender =
    row.sender_type === "guest"
      ? "guest"
      : row.sender_type === "ai"
        ? "ai"
        : "owner";

  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender,
    content: row.body,
    timestamp: formatMessageTime(row.created_at),
    aiGenerated: row.ai_generated,
    aiAutoSent: row.ai_auto_sent,
  };
}

export function mapConversation(
  row: DbConversation,
  messages: Message[]
): Conversation {
  const propertySlug = (row.property?.slug ?? row.property_id) as PropertyId;
  const last = messages[messages.length - 1];

  return {
    id: row.id,
    guestId: row.guest_id,
    guestName: row.guest?.full_name ?? "Huésped",
    propertyId: propertySlug,
    propertyDbId: row.property_id,
    platform: toPlatform(row.channel),
    propertyName: row.property?.name ?? undefined,
    intentCategory: (row.intent_category as IntentCategory) ?? "otro",
    intentManualOverride: row.intent_manual_override ?? false,
    lastMessage: row.last_message_preview ?? last?.content ?? "",
    lastMessageAt: row.last_message_at
      ? formatMessageTime(row.last_message_at)
      : "—",
    unread: row.unread,
    urgency: mapUrgency(row.priority),
    labels: row.labels as ConversationLabel[],
    messages,
    sentiment: (row.sentiment as Conversation["sentiment"]) ?? undefined,
    reservationId: row.reservation_id ?? undefined,
    aiStatus: row.ai_status ?? undefined,
  };
}

export function mapTask(row: DbTask, propertySlug: PropertyId): OperationTask {
  const checklist = Array.isArray(row.checklist)
    ? (row.checklist as { item: string; done: boolean }[])
    : undefined;

  return {
    id: row.id,
    propertyId: propertySlug,
    propertyDbId: row.property_id,
    title: row.title,
    type: row.type as OperationTask["type"],
    status: row.status as OperationTask["status"],
    assignee: row.assigned_to ?? undefined,
    dueDate: row.due_date ?? "—",
    checklist,
    description: row.description ?? undefined,
    reservationId: row.reservation_id ?? undefined,
    unitDbId: row.unit_id ?? undefined,
  };
}

export function mapUnit(row: DbUnit): Unit {
  return {
    id: row.id,
    propertyDbId: row.property_id,
    slug: row.slug,
    name: row.name,
    capacity: row.capacity,
    status: row.status as Unit["status"],
    notes: row.notes ?? undefined,
  };
}

export function mapKnowledgeItem(row: DbKb): KnowledgeBaseItem {
  return {
    id: row.id,
    propertyDbId: row.property_id,
    topic: row.title,
    category: row.category,
    content: row.content ?? undefined,
    status: row.status as KnowledgeBaseItem["status"],
  };
}

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return new Intl.DateTimeFormat("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    }
    return new Intl.DateTimeFormat("es-UY", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return iso;
  }
}
