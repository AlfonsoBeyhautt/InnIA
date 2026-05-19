import { requireAuth } from "@/lib/auth/session";
import type {
  Database,
  Tables,
  KnowledgeCategory,
  KnowledgeStatus,
  AiDecision,
} from "@/lib/supabase/types";

type GuestInsert = Database["public"]["Tables"]["guests"]["Insert"];
type GuestUpdate = Database["public"]["Tables"]["guests"]["Update"];
import type { Guest, Property, Reservation } from "@/types";

async function authDb() {
  const { supabase, user } = await requireAuth();
  return { supabase, userId: user.id };
}

/** Prevent overlapping reservations on the same unit */
export async function assertNoReservationOverlap(params: {
  unitId: string;
  checkIn: string;
  checkOut: string;
  excludeReservationId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { unitId, checkIn, checkOut, excludeReservationId } = params;

  const { supabase } = await authDb();
  let query = supabase
    .from("reservations")
    .select("id, check_in, check_out, guest:guests(full_name)")
    .eq("unit_id", unitId)
    .neq("status", "cancelada")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data, error } = await query.returns<
    { id: string; check_in: string; check_out: string }[]
  >();
  if (error) throw error;

  if (data && data.length > 0) {
    const conflict = data[0]!;
    return {
      ok: false,
      message: `Conflicto de fechas: ya existe una reserva del ${conflict.check_in} al ${conflict.check_out} en esta unidad.`,
    };
  }
  return { ok: true };
}

export async function createGuest(
  input: Partial<Guest> & { fullName: string }
): Promise<Tables<"guests">> {
  const { supabase, userId } = await authDb();
  const row: GuestInsert = {
    owner_id: userId,
    full_name: input.fullName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    document_type: input.documentType ?? null,
    document_number: input.documentId ?? null,
    passport_number: input.passportNumber ?? null,
    nationality: input.nationality ?? null,
    origin_platform: input.originPlatform ?? null,
    validation_status: input.validationStatus ?? "pendiente",
    marketing_consent: input.marketingConsent ?? false,
    preferences: input.preferences ?? [],
    internal_notes: input.internalNotes ?? null,
    observations: input.observations ?? null,
    tags: input.tags ?? [],
    preferred_property_slug: input.preferredPropertyId ?? null,
    rental_data: input.rentalData ?? null,
    incidents: (input.incidents ?? []) as unknown as GuestInsert["incidents"],
    reviews: (input.reviews ?? []) as unknown as GuestInsert["reviews"],
  };

  const { data, error } = await supabase
    .from("guests")
    .insert([row])
    .select()
    .single<Tables<"guests">>();
  if (error) throw error;
  return data;
}

export async function updateGuest(id: string, input: Partial<Guest>) {
  const patch: GuestUpdate = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.documentId !== undefined) patch.document_number = input.documentId;
  if (input.documentType !== undefined) patch.document_type = input.documentType;
  if (input.passportNumber !== undefined) patch.passport_number = input.passportNumber;
  if (input.nationality !== undefined) patch.nationality = input.nationality;
  if (input.originPlatform !== undefined) patch.origin_platform = input.originPlatform;
  if (input.validationStatus !== undefined) patch.validation_status = input.validationStatus;
  if (input.marketingConsent !== undefined) patch.marketing_consent = input.marketingConsent;
  if (input.preferences !== undefined) patch.preferences = input.preferences;
  if (input.internalNotes !== undefined) patch.internal_notes = input.internalNotes;
  if (input.observations !== undefined) patch.observations = input.observations;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.preferredPropertyId !== undefined)
    patch.preferred_property_slug = input.preferredPropertyId;
  if (input.rentalData !== undefined) patch.rental_data = input.rentalData;
  if (input.incidents !== undefined)
    patch.incidents = input.incidents as unknown as GuestUpdate["incidents"];
  if (input.reviews !== undefined)
    patch.reviews = input.reviews as unknown as GuestUpdate["reviews"];

  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("guests")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProperty(dbId: string, input: Partial<Property>) {
  const patch: Database["public"]["Tables"]["properties"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.location !== undefined) patch.location = input.location;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.wifiName !== undefined) patch.wifi_name = input.wifiName;
  if (input.wifiPassword !== undefined) patch.wifi_password = input.wifiPassword;
  if (input.houseRules !== undefined) patch.house_rules = input.houseRules;
  if (input.checkInInstructions !== undefined)
    patch.arrival_instructions = input.checkInInstructions;
  if (input.lockInstructions !== undefined) patch.lock_instructions = input.lockInstructions;
  if (input.parkingInfo !== undefined) patch.parking_info = input.parkingInfo;
  if (input.petPolicy !== undefined) patch.pet_policy = input.petPolicy;
  if (input.emergencyContact !== undefined) patch.emergency_contact = input.emergencyContact;
  if (input.internalNotes !== undefined) patch.internal_notes = input.internalNotes;
  if (input.checkInTime !== undefined) patch.check_in_time = input.checkInTime;
  if (input.checkOutTime !== undefined) patch.check_out_time = input.checkOutTime;

  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", dbId)
    .eq("owner_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createReservation(input: {
  guestId: string;
  propertyDbId: string;
  unitDbId: string;
  platform: string;
  checkIn: string;
  checkOut: string;
  guestsCount?: number;
  totalAmount?: number;
  status?: string;
}) {
  const overlap = await assertNoReservationOverlap({
    unitId: input.unitDbId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });
  if (!overlap.ok) throw new Error(overlap.message);

  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      guest_id: input.guestId,
      property_id: input.propertyDbId,
      unit_id: input.unitDbId,
      platform: input.platform,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests_count: input.guestsCount ?? 1,
      total_amount: input.totalAmount ?? 0,
      status: input.status ?? "confirmada",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReservation(id: string, input: Partial<Reservation>) {
  if (input.checkIn && input.checkOut && input.unitDbId) {
    const overlap = await assertNoReservationOverlap({
      unitId: input.unitDbId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      excludeReservationId: id,
    });
    if (!overlap.ok) throw new Error(overlap.message);
  }

  const patch: Database["public"]["Tables"]["reservations"]["Update"] = {};
  if (input.checkIn !== undefined) patch.check_in = input.checkIn;
  if (input.checkOut !== undefined) patch.check_out = input.checkOut;
  if (input.status !== undefined) patch.status = input.status;
  if (input.paymentStatus !== undefined) patch.payment_status = input.paymentStatus;
  if (input.guestCount !== undefined) patch.guests_count = input.guestCount;
  if (input.amount !== undefined) patch.total_amount = input.amount;
  if (input.unitDbId !== undefined) patch.unit_id = input.unitDbId;

  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("reservations")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendMessage(input: {
  conversationId: string;
  senderType: "guest" | "owner" | "ai";
  body: string;
  senderName?: string;
  aiGenerated?: boolean;
  aiAutoSent?: boolean;
}): Promise<Tables<"messages">> {
  const { supabase } = await authDb();
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_type: input.senderType,
      sender_name: input.senderName ?? null,
      body: input.body,
      ai_generated: input.aiGenerated ?? false,
      ai_auto_sent: input.aiAutoSent ?? false,
    })
    .select()
    .single<Tables<"messages">>();

  if (error) throw error;

  const priority =
    input.senderType === "guest" ? undefined : undefined;

  await supabase
    .from("conversations")
    .update({
      last_message_preview: input.body.slice(0, 120),
      last_message_at: new Date().toISOString(),
      unread: input.senderType === "guest",
      ...(priority ? { priority } : {}),
    })
    .eq("id", input.conversationId);

  return msg;
}

export async function updateConversation(
  id: string,
  patch: {
    priority?: string;
    ai_status?: string;
    labels?: string[];
    unread?: boolean;
    status?: string;
  }
) {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertKnowledgeItem(input: {
  propertyDbId: string;
  category: KnowledgeCategory;
  title: string;
  content?: string;
  status: KnowledgeStatus;
}) {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("knowledge_base_items")
    .upsert(
      {
        property_id: input.propertyDbId,
        category: input.category,
        title: input.title,
        content: input.content ?? null,
        status: input.status,
      },
      { onConflict: "property_id,category" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createOperationTask(input: {
  propertyDbId: string;
  unitDbId?: string;
  reservationId?: string;
  type: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status?: string;
  dueDate?: string;
  checklist?: { item: string; done: boolean }[];
}) {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("operation_tasks")
    .insert({
      owner_id: userId,
      property_id: input.propertyDbId,
      unit_id: input.unitDbId ?? null,
      reservation_id: input.reservationId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      assigned_to: input.assignedTo ?? null,
      status: input.status ?? "Pendiente",
      due_date: input.dueDate ?? null,
      checklist: input.checklist ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOperationTask(
  id: string,
  patch: Partial<{
    status: string;
    assigned_to: string;
    title: string;
    description: string;
    checklist: { item: string; done: boolean }[];
  }>
) {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("operation_tasks")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createNotification(input: {
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      owner_id: userId,
      type: input.type,
      title: input.title,
      body: input.body,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markNotificationRead(id: string) {
  const { supabase, userId } = await authDb();
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("owner_id", userId);
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await authDb();
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("owner_id", userId)
    .eq("read", false);
}

export async function upsertIntegration(
  provider: Tables<"integrations">["provider"],
  patch: Database["public"]["Tables"]["integrations"]["Update"]
) {
  const { supabase, userId } = await authDb();
  const row: Database["public"]["Tables"]["integrations"]["Insert"] = {
    owner_id: userId,
    provider,
    ...patch,
  };
  const { data, error } = await supabase
    .from("integrations")
    .upsert(row, { onConflict: "owner_id,provider" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createAiResponseLog(input: {
  conversationId: string;
  messageId?: string;
  generatedResponse: string;
  usedKnowledge: string[];
  missingInformation: string[];
  aiDecision: AiDecision;
  autoSent: boolean;
}): Promise<Tables<"ai_response_logs">> {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("ai_response_logs")
    .insert({
      conversation_id: input.conversationId,
      message_id: input.messageId ?? null,
      generated_response: input.generatedResponse,
      used_knowledge: input.usedKnowledge,
      missing_information: input.missingInformation,
      ai_decision: input.aiDecision,
      auto_sent: input.autoSent,
    })
    .select()
    .single<Tables<"ai_response_logs">>();

  if (error) throw error;
  return data;
}
