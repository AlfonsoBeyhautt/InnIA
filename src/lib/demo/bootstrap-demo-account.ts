import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  conversations as mockConversations,
  guests as mockGuests,
  operationTasks as mockTasks,
  properties as mockProperties,
  reservations as mockReservations,
} from "@/data/mock";
import { notifications as mockNotifications } from "@/data/mock/notifications";
import { DEMO_PROPERTY_IDS, DEMO_UNIT_IDS, isDemoAccountEmail } from "@/lib/demo/constants";
import type { Json } from "@/lib/supabase/types";

export type BootstrapResult = {
  seeded: boolean;
  message: string;
  properties: number;
  guests: number;
  reservations: number;
  conversations: number;
  tasks: number;
  notifications: number;
};

async function accountNeedsDemo(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<boolean> {
  const { count: guestCount } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((guestCount ?? 0) === 0) return true;

  const { data: props } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", userId);
  const propertyIds = (props ?? []).map((p) => p.id);
  if (propertyIds.length === 0) return true;

  const { count: resCount } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .in("property_id", propertyIds);

  const { count: convCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  const { count: taskCount } = await supabase
    .from("operation_tasks")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  const { count: notifCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  return (
    (resCount ?? 0) === 0 ||
    (convCount ?? 0) === 0 ||
    (taskCount ?? 0) === 0 ||
    (notifCount ?? 0) === 0
  );
}

export async function bootstrapDemoAccount(
  userId: string,
  email?: string | null
): Promise<BootstrapResult> {
  const supabase = await createServerSupabaseClient();

  if (email && isDemoAccountEmail(email)) {
    await supabase.rpc("claim_checkinn_demo", { p_email: email } as never);
  }

  const needsDemo = await accountNeedsDemo(supabase, userId);
  if (!needsDemo) {
    return {
      seeded: false,
      message: "La cuenta ya tiene datos operativos.",
      properties: 0,
      guests: 0,
      reservations: 0,
      conversations: 0,
      tasks: 0,
      notifications: 0,
    };
  }

  let properties = 0;
  let guests = 0;
  let reservations = 0;
  let conversations = 0;
  let tasks = 0;
  let notifications = 0;

  for (const p of mockProperties) {
    const dbId = DEMO_PROPERTY_IDS[p.id as keyof typeof DEMO_PROPERTY_IDS];
    const { error } = await supabase.from("properties").upsert(
      {
        id: dbId,
        owner_id: userId,
        slug: p.id,
        name: p.name,
        location: p.location,
        image_url: p.image,
        status: p.status,
        occupancy: p.occupancy,
        platforms: p.platforms,
        smart_lock_online: p.smartLockOnline,
        wifi_name: p.wifi?.split(" · ")[0] ?? null,
        wifi_password: p.wifi?.includes("clave:") ? p.wifi.split("clave:")[1]?.trim() : null,
        house_rules: p.houseRules ?? null,
        arrival_instructions: p.checkInInstructions ?? null,
        check_out_time: "10:00",
      },
      { onConflict: "owner_id,slug" }
    );
    if (!error) properties++;
  }

  const unitRows = [
    { id: DEMO_UNIT_IDS["pdd-1"], property_id: DEMO_PROPERTY_IDS.pdd, slug: "pdd-1", name: "Casa completa", capacity: 8 },
    { id: DEMO_UNIT_IDS["pdd-2"], property_id: DEMO_PROPERTY_IDS.pdd, slug: "pdd-2", name: "Suite mar", capacity: 4 },
    { id: DEMO_UNIT_IDS["pdd-3"], property_id: DEMO_PROPERTY_IDS.pdd, slug: "pdd-3", name: "Dúplex", capacity: 6 },
    { id: DEMO_UNIT_IDS["rocha-1"], property_id: DEMO_PROPERTY_IDS.rocha, slug: "rocha-1", name: "Cabaña principal", capacity: 6 },
    { id: DEMO_UNIT_IDS["paloma-1"], property_id: DEMO_PROPERTY_IDS.paloma, slug: "paloma-1", name: "Apartamento 4B", capacity: 4 },
    { id: DEMO_UNIT_IDS["paloma-2"], property_id: DEMO_PROPERTY_IDS.paloma, slug: "paloma-2", name: "Estudio 2A", capacity: 2 },
  ];
  await supabase.from("units").upsert(unitRows, { onConflict: "property_id,slug" });

  const guestIdBySlug = new Map<string, string>();

  const { data: existingGuests } = await supabase
    .from("guests")
    .select("id, full_name, preferred_property_slug")
    .eq("owner_id", userId);

  for (const g of mockGuests) {
    const match = (existingGuests ?? []).find(
      (eg) => eg.preferred_property_slug === g.id || eg.full_name === g.fullName
    );
    if (match) guestIdBySlug.set(g.id, match.id);
  }

  for (const g of mockGuests) {
    if (guestIdBySlug.has(g.id)) continue;
    const guestUuid = crypto.randomUUID();
    guestIdBySlug.set(g.id, guestUuid);
    const { error } = await supabase.from("guests").insert({
      id: guestUuid,
      owner_id: userId,
      full_name: g.fullName,
      email: g.email,
      phone: g.phone,
      document_number: g.documentId,
      passport_number: g.passportNumber ?? null,
      nationality: g.nationality,
      origin_platform: g.originPlatform,
      validation_status: g.validationStatus,
      marketing_consent: g.marketingConsent,
      preferences: g.preferences ?? [],
      internal_notes: g.internalNotes,
      observations: g.observations,
      tags: g.tags,
      preferred_property_slug: g.preferredPropertyId,
      rental_data: (g.rentalData ?? null) as unknown as Json,
      incidents: (g.incidents ?? []) as unknown as Json,
      reviews: (g.reviews ?? []) as unknown as Json,
    });
    if (!error) guests++;
  }

  const { count: existingResCount } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .in("property_id", Object.values(DEMO_PROPERTY_IDS));

  if ((existingResCount ?? 0) === 0) {
  for (const r of mockReservations) {
    const guestId = guestIdBySlug.get(r.guestId);
    const propertyId = DEMO_PROPERTY_IDS[r.propertyId as keyof typeof DEMO_PROPERTY_IDS];
    const unitId = DEMO_UNIT_IDS[r.unitId];
    if (!guestId || !propertyId || !unitId) continue;

    const { error } = await supabase.from("reservations").insert({
      guest_id: guestId,
      property_id: propertyId,
      unit_id: unitId,
      platform: r.platform,
      check_in: r.checkIn,
      check_out: r.checkOut,
      status: r.status,
      payment_status: r.paymentStatus,
      total_amount: r.amount,
      guests_count: r.guestCount,
      lock_code_status: r.lockCodeStatus,
    });
    if (!error) reservations++;
  }
  }

  const { count: existingTaskCount } = await supabase
    .from("operation_tasks")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((existingTaskCount ?? 0) === 0) {
  for (const t of mockTasks) {
    const propertyId = DEMO_PROPERTY_IDS[t.propertyId as keyof typeof DEMO_PROPERTY_IDS];
    if (!propertyId) continue;
    const { error } = await supabase.from("operation_tasks").insert({
      owner_id: userId,
      property_id: propertyId,
      type: t.type,
      title: t.title,
      status: t.status,
      assigned_to: t.assignee ?? null,
      checklist: (t.checklist ?? []) as unknown as Json,
    });
    if (!error) tasks++;
  }
  }

  const { count: existingConvCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((existingConvCount ?? 0) === 0) {
  for (const c of mockConversations) {
    const propertyId = DEMO_PROPERTY_IDS[c.propertyId as keyof typeof DEMO_PROPERTY_IDS];
    let guestId = guestIdBySlug.get(c.guestId);
    if (!guestId) {
      guestId = crypto.randomUUID();
      await supabase.from("guests").insert({
        id: guestId,
        owner_id: userId,
        full_name: c.guestName,
      });
    }
    if (!propertyId) continue;

    const priority =
      c.urgency === "urgente" ? "urgente" : c.urgency === "revisar" ? "revisar" : "normal";

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        owner_id: userId,
        guest_id: guestId,
        property_id: propertyId,
        channel: c.platform,
        priority,
        labels: c.labels,
        sentiment: c.sentiment,
        last_message_preview: c.lastMessage,
        unread: c.unread,
      })
      .select("id")
      .single();

    if (convErr || !conv) continue;
    conversations++;

    for (const m of c.messages) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: m.sender,
        body: m.content,
        ai_generated: m.sender === "ai",
      });
    }
  }
  }

  const { count: existingNotifCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((existingNotifCount ?? 0) === 0) {
  for (const n of mockNotifications.slice(0, 8)) {
    const { error } = await supabase.from("notifications").insert({
      owner_id: userId,
      type:
        n.category === "mensaje"
          ? "mensaje"
          : n.category === "reserva"
            ? "reserva"
            : n.category === "tarea"
              ? "tarea"
              : n.category === "ia"
                ? "ia"
                : "integracion",
      title: n.title,
      body: n.description,
      read: n.read,
    });
    if (!error) notifications++;
  }
  }

  const providers = ["airbnb", "booking", "whatsapp_business", "email"] as const;
  for (const provider of providers) {
    await supabase.from("integrations").upsert(
      {
        owner_id: userId,
        provider,
        status: provider === "email" ? "disconnected" : "connected",
        sync_status: provider === "email" ? "pending" : "ok",
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,provider" }
    );
  }

  return {
    seeded: true,
    message: "Cuenta demo operativa configurada.",
    properties,
    guests,
    reservations,
    conversations,
    tasks,
    notifications,
  };
}
