import { requireAuth } from "@/lib/auth/session";
import {
  mapConversation,
  mapGuest,
  mapKnowledgeItem,
  mapMessage,
  mapProperty,
  mapReservation,
  mapTask,
} from "@/lib/db/mappers";
import type {
  Conversation,
  Guest,
  KnowledgeBaseItem,
  OperationTask,
  Property,
  Reservation,
} from "@/types";
import type { Tables } from "@/lib/supabase/types";

async function authDb() {
  const { supabase, user } = await requireAuth();
  return { supabase, userId: user.id };
}

export async function getProperties(): Promise<Property[]> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", userId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map(mapProperty);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProperty(data) : null;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProperty(data) : null;
}

export async function getUnits(propertyDbId: string) {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("property_id", propertyDbId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

async function guestReservationHistory(guestId: string) {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, property:properties(slug), unit:units(slug)")
    .eq("guest_id", guestId)
    .order("check_in", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => {
    const mapped = mapReservation(r as Parameters<typeof mapReservation>[0]);
    return {
      id: mapped.id,
      propertyId: mapped.propertyId,
      unitId: mapped.unitId,
      checkIn: mapped.checkIn,
      checkOut: mapped.checkOut,
      platform: mapped.platform,
      amount: mapped.amount,
      status: mapped.status,
    };
  });
}

export async function getGuests(): Promise<Guest[]> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("owner_id", userId)
    .order("full_name");

  if (error) throw error;

  const guests = await Promise.all(
    (data ?? []).map(async (row) => {
      const history = await guestReservationHistory(row.id);
      return mapGuest(row, history);
    })
  );
  return guests;
}

export async function getGuestById(id: string): Promise<Guest | null> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const history = await guestReservationHistory(id);
  return mapGuest(data, history);
}

export async function getReservations(filters?: {
  propertySlug?: string;
  unitDbId?: string;
}): Promise<Reservation[]> {
  const { supabase, userId } = await authDb();
  let query = supabase
    .from("reservations")
    .select("*, guest:guests(full_name), property:properties!inner(slug, owner_id), unit:units(slug)")
    .eq("property.owner_id", userId)
    .order("check_in");

  if (filters?.propertySlug && filters.propertySlug !== "all") {
    query = query.eq("property.slug", filters.propertySlug);
  }
  if (filters?.unitDbId) {
    query = query.eq("unit_id", filters.unitDbId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapReservation(r as Parameters<typeof mapReservation>[0]));
}

export async function getConversations(): Promise<Conversation[]> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, guest:guests(full_name), property:properties(slug)")
    .eq("owner_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const result: Conversation[] = [];
  type ConvRow = Tables<"conversations"> & {
    guest?: { full_name: string } | null;
    property?: { slug: string } | null;
  };
  for (const row of (data ?? []) as ConvRow[]) {
    const messages = await getMessages(row.id);
    result.push(
      mapConversation(
        row as Parameters<typeof mapConversation>[0],
        messages
      )
    );
  }
  return result;
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, guest:guests(full_name), property:properties(slug)")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const messages = await getMessages(id);
  return mapConversation(data as Parameters<typeof mapConversation>[0], messages);
}

export async function getMessages(conversationId: string) {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function getOperationTasks(propertySlug?: string): Promise<OperationTask[]> {
  const { supabase, userId } = await authDb();
  let query = supabase
    .from("operation_tasks")
    .select("*, property:properties!inner(slug, owner_id)")
    .eq("owner_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (propertySlug && propertySlug !== "all") {
    query = query.eq("property.slug", propertySlug);
  }

  const { data, error } = await query;
  if (error) throw error;

  type TaskRow = Tables<"operation_tasks"> & {
    property?: { slug: string } | null;
  };
  return ((data ?? []) as TaskRow[]).map((row) => {
    const slug = row.property?.slug ?? "pdd";
    return mapTask(row, slug as Property["id"]);
  });
}

export async function getKnowledgeBase(propertyDbId: string): Promise<KnowledgeBaseItem[]> {
  const { supabase } = await authDb();
  const { data, error } = await supabase
    .from("knowledge_base_items")
    .select("*")
    .eq("property_id", propertyDbId)
    .order("category");

  if (error) throw error;
  return (data ?? []).map(mapKnowledgeItem);
}

export async function getNotifications() {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getIntegrations() {
  const { supabase, userId } = await authDb();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("owner_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function resolvePropertyDbId(slugOrId: string): Promise<string | null> {
  if (slugOrId.includes("-") && slugOrId.length > 20) {
    return slugOrId;
  }
  const p = await getPropertyBySlug(slugOrId);
  return p?.dbId ?? null;
}
