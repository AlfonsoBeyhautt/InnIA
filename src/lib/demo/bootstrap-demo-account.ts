import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  conversations as mockConversations,
  guests as mockGuests,
  operationTasks as mockTasks,
  properties as mockProperties,
  reservations as mockReservations,
} from "@/data/mock";
import { notifications as mockNotifications } from "@/data/mock/notifications";
import { clearOwnerOperationalData } from "@/lib/demo/clear-owner-data";
import {
  addDaysFromToday,
  addDaysToIso,
  shiftMockIsoDate,
} from "@/lib/demo/date-shift";
import { DEMO_PROPERTY_IDS, DEMO_UNIT_IDS, isDemoAccountEmail } from "@/lib/demo/constants";
import type { Json, KnowledgeCategory, KnowledgeStatus } from "@/lib/supabase/types";

export type BootstrapResult = {
  seeded: boolean;
  message: string;
  properties: number;
  guests: number;
  reservations: number;
  conversations: number;
  tasks: number;
  notifications: number;
  knowledgeItems: number;
  adCampaigns: number;
};

export type BootstrapOptions = {
  /** Borra datos operativos del usuario y vuelve a sembrar el pack completo. */
  force?: boolean;
};

type ExtraReservation = {
  guestSlug: string;
  propertyKey: keyof typeof DEMO_PROPERTY_IDS;
  unitId: string;
  checkInDays: number;
  nights: number;
  platform: string;
  status: string;
  paymentStatus: string;
  lockCodeStatus: string;
  amount: number;
  guestCount: number;
};

const EXTRA_RESERVATIONS: ExtraReservation[] = [
  {
    guestSlug: "g3",
    propertyKey: "pdd",
    unitId: "pdd-3",
    checkInDays: -12,
    nights: 3,
    platform: "Airbnb",
    status: "check-out",
    paymentStatus: "pagado",
    lockCodeStatus: "expirado",
    amount: 890,
    guestCount: 2,
  },
  {
    guestSlug: "g2",
    propertyKey: "paloma",
    unitId: "paloma-2",
    checkInDays: -5,
    nights: 2,
    platform: "Booking",
    status: "check-out",
    paymentStatus: "pagado",
    lockCodeStatus: "expirado",
    amount: 310,
    guestCount: 2,
  },
  {
    guestSlug: "g4",
    propertyKey: "rocha",
    unitId: "rocha-1",
    checkInDays: 5,
    nights: 4,
    platform: "Airbnb",
    status: "confirmada",
    paymentStatus: "pagado",
    lockCodeStatus: "pendiente",
    amount: 720,
    guestCount: 1,
  },
  {
    guestSlug: "g5",
    propertyKey: "pdd",
    unitId: "pdd-1",
    checkInDays: 8,
    nights: 3,
    platform: "WhatsApp",
    status: "confirmada",
    paymentStatus: "pendiente",
    lockCodeStatus: "pendiente",
    amount: 640,
    guestCount: 2,
  },
  {
    guestSlug: "g1",
    propertyKey: "paloma",
    unitId: "paloma-1",
    checkInDays: 12,
    nights: 5,
    platform: "Directa",
    status: "pendiente",
    paymentStatus: "parcial",
    lockCodeStatus: "pendiente",
    amount: 1100,
    guestCount: 4,
  },
  {
    guestSlug: "g6",
    propertyKey: "rocha",
    unitId: "rocha-1",
    checkInDays: -28,
    nights: 7,
    platform: "Booking",
    status: "check-out",
    paymentStatus: "pagado",
    lockCodeStatus: "expirado",
    amount: 1450,
    guestCount: 3,
  },
];

const EXTRA_CONVERSATIONS = [
  {
    guestId: "g6",
    guestName: "Sofía Martínez",
    propertyId: "paloma",
    platform: "WhatsApp",
    intentCategory: "comercial",
    lastMessage: "¿Tienen disponibilidad para julio?",
    unread: true,
    urgency: "revisar" as const,
    labels: ["Consulta comercial"],
    sentiment: "neutral",
    messages: [
      { sender: "guest" as const, content: "¿Tienen disponibilidad para julio en el apartamento?" },
      { sender: "ai" as const, content: "¡Hola Sofía! Tenemos fechas en julio. ¿Cuántas noches pensás quedarte?" },
    ],
  },
  {
    guestId: "g3",
    guestName: "Diego y Ana",
    propertyId: "pdd",
    platform: "Instagram",
    intentCategory: "nueva_consulta",
    lastMessage: "¿Cuánto sale un fin de semana largo?",
    unread: true,
    urgency: "normal" as const,
    labels: ["Nueva consulta"],
    sentiment: "positivo",
    messages: [
      { sender: "guest" as const, content: "¿Cuánto sale un fin de semana largo para 4 personas?" },
    ],
  },
];

const DEMO_AD_CAMPAIGNS = [
  {
    propertyKey: "pdd" as const,
    name: "Verano Punta del Diablo",
    objective: "Reservas directas temporada alta",
    budget: 120,
    startDays: 0,
    endDays: 60,
    channel: "instagram",
    adCopy: "Casa frente al mar con check-in autónomo. Reservá directo y ahorrá comisiones.",
    cta: "Reservar ahora",
    status: "listo",
  },
  {
    propertyKey: "rocha" as const,
    name: "Escapada Cabaña Rocha",
    objective: "Ocupación entre semana",
    budget: 80,
    startDays: 7,
    endDays: 45,
    channel: "instagram",
    adCopy: "Cabaña con parrillero y WiFi. Ideal para teletrabajo.",
    cta: "Ver fechas",
    status: "borrador",
  },
  {
    propertyKey: "paloma" as const,
    name: "Apartamento La Paloma",
    objective: "Huéspedes recurrentes",
    budget: 60,
    startDays: -14,
    endDays: 30,
    channel: "instagram",
    adCopy: "Apartamento céntrico, edificio familiar. Últimas fechas de junio.",
    cta: "Consultar",
    status: "listo",
  },
];

function kbStatus(content: string): KnowledgeStatus {
  const t = content.trim();
  if (t.length >= 12) return "completo";
  if (t.length > 0) return "incompleto";
  return "faltante";
}

function notificationDbType(
  category: string
): "mensaje" | "reserva" | "tarea" | "ia" | "integracion" {
  if (category === "mensaje") return "mensaje";
  if (category === "reserva" || category === "pago") return "reserva";
  if (category === "tarea" || category === "operaciones") return "tarea";
  if (category === "ia") return "ia";
  return "integracion";
}

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

async function seedKnowledgeForProperties(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<number> {
  let count = 0;
  for (const p of mockProperties) {
    const propertyId = DEMO_PROPERTY_IDS[p.id as keyof typeof DEMO_PROPERTY_IDS];
    const wifiContent = p.wifi ?? "";
    const items: { category: KnowledgeCategory; title: string; content: string }[] = [
      { category: "wifi", title: "WiFi", content: wifiContent },
      {
        category: "check_in",
        title: "Check-in",
        content: [p.checkInInstructions ?? "", "Horario desde las 15:00"].filter(Boolean).join("\n"),
      },
      {
        category: "check_out",
        title: "Check-out",
        content: p.checkOutInstructions ?? "Check-out 10:00.",
      },
      {
        category: "parking",
        title: "Estacionamiento",
        content:
          p.id === "pdd"
            ? "Estacionamiento gratuito a 2 cuadras. Enviar ubicación por mensaje."
            : p.id === "paloma"
              ? "Cochera opcional en subsuelo (consultar)."
              : "Estacionamiento en calle frente a la cabaña.",
      },
      {
        category: "pets",
        title: "Mascotas",
        content:
          p.id === "rocha"
            ? "No se aceptan mascotas en Cabaña Rocha."
            : "Mascotas pequeñas con aviso previo.",
      },
      { category: "house_rules", title: "Reglas de la casa", content: p.houseRules ?? "" },
      {
        category: "lock_instructions",
        title: "Cerradura",
        content: p.checkInInstructions?.includes("código")
          ? p.checkInInstructions
          : "Código enviado 24 h antes del check-in.",
      },
      {
        category: "emergency",
        title: "Emergencias",
        content: "Emergencias 24 h: +598 99 000 911 · WhatsApp operaciones.",
      },
    ];

    for (const item of items) {
      const { error } = await supabase.from("knowledge_base_items").upsert(
        {
          property_id: propertyId,
          category: item.category,
          title: item.title,
          content: item.content || null,
          status: kbStatus(item.content),
        },
        { onConflict: "property_id,category" }
      );
      if (!error) count++;
    }
  }
  return count;
}

export async function bootstrapDemoAccount(
  userId: string,
  email?: string | null,
  options?: BootstrapOptions
): Promise<BootstrapResult> {
  const supabase = await createServerSupabaseClient();
  const force = options?.force === true;

  if (email && isDemoAccountEmail(email)) {
    await supabase.rpc("claim_checkinn_demo", { p_email: email } as never);
  }

  if (force) {
    await clearOwnerOperationalData(userId);
  } else {
    const needsDemo = await accountNeedsDemo(supabase, userId);
    if (!needsDemo) {
      return {
        seeded: false,
        message: "La cuenta ya tiene datos. Usá «Recargar datos demo» para reemplazarlos.",
        properties: 0,
        guests: 0,
        reservations: 0,
        conversations: 0,
        tasks: 0,
        notifications: 0,
        knowledgeItems: 0,
        adCampaigns: 0,
      };
    }
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
      (eg) => eg.preferred_property_slug === g.preferredPropertyId || eg.full_name === g.fullName
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

  const seedReservations = force || (existingResCount ?? 0) === 0;

  if (seedReservations) {
  for (const r of mockReservations) {
    const guestId = guestIdBySlug.get(r.guestId);
    const propertyId = DEMO_PROPERTY_IDS[r.propertyId as keyof typeof DEMO_PROPERTY_IDS];
    const unitId = DEMO_UNIT_IDS[r.unitId];
    if (!guestId || !propertyId || !unitId) continue;

    const checkIn = shiftMockIsoDate(r.checkIn);
    const checkOut = addDaysToIso(checkIn, Math.max(
      1,
      Math.round(
        (new Date(`${r.checkOut}T12:00:00Z`).getTime() -
          new Date(`${r.checkIn}T12:00:00Z`).getTime()) /
          86400000
      )
    ));

    const { error } = await supabase.from("reservations").insert({
      guest_id: guestId,
      property_id: propertyId,
      unit_id: unitId,
      platform: r.platform,
      check_in: checkIn,
      check_out: checkOut,
      status: r.status,
      payment_status: r.paymentStatus,
      total_amount: r.amount,
      guests_count: r.guestCount,
      lock_code_status: r.lockCodeStatus,
    });
    if (!error) reservations++;
  }

  for (const extra of EXTRA_RESERVATIONS) {
    const guestId = guestIdBySlug.get(extra.guestSlug);
    const propertyId = DEMO_PROPERTY_IDS[extra.propertyKey];
    const unitId = DEMO_UNIT_IDS[extra.unitId];
    if (!guestId || !propertyId || !unitId) continue;

    const checkIn = addDaysFromToday(extra.checkInDays);
    const checkOut = addDaysToIso(checkIn, extra.nights);

    const { error } = await supabase.from("reservations").insert({
      guest_id: guestId,
      property_id: propertyId,
      unit_id: unitId,
      platform: extra.platform,
      check_in: checkIn,
      check_out: checkOut,
      status: extra.status,
      payment_status: extra.paymentStatus,
      total_amount: extra.amount,
      guests_count: extra.guestCount,
      lock_code_status: extra.lockCodeStatus,
    });
    if (!error) reservations++;
  }
  }

  const { count: existingTaskCount } = await supabase
    .from("operation_tasks")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (force || (existingTaskCount ?? 0) === 0) {
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

  if (force || (existingConvCount ?? 0) === 0) {
  const allConversations = [...mockConversations, ...EXTRA_CONVERSATIONS];

  for (const c of allConversations) {
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
        intent_category: c.intentCategory ?? "otro",
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

  if (force || (existingNotifCount ?? 0) === 0) {
  for (const n of mockNotifications) {
    const { error } = await supabase.from("notifications").insert({
      owner_id: userId,
      type: notificationDbType(n.category),
      title: n.title,
      body: n.description,
      read: n.read,
    });
    if (!error) notifications++;
  }
  }

  const providers = ["airbnb", "booking", "whatsapp_business", "email", "instagram"] as const;
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

  const knowledgeItems = await seedKnowledgeForProperties(supabase);

  let adCampaigns = 0;
  if (force) {
    await supabase.from("ad_campaigns").delete().eq("owner_id", userId);
  }
  const { count: existingCampaignCount } = await supabase
    .from("ad_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (force || (existingCampaignCount ?? 0) === 0) {
  for (const camp of DEMO_AD_CAMPAIGNS) {
    const propertyId = DEMO_PROPERTY_IDS[camp.propertyKey];
    const { error } = await supabase.from("ad_campaigns").insert({
      owner_id: userId,
      property_id: propertyId,
      name: camp.name,
      objective: camp.objective,
      budget: camp.budget,
      start_date: addDaysFromToday(camp.startDays),
      end_date: addDaysFromToday(camp.endDays),
      channel: camp.channel,
      ad_copy: camp.adCopy,
      cta: camp.cta,
      status: camp.status,
    });
    if (!error) adCampaigns++;
  }
  }

  return {
    seeded: true,
    message: force
      ? "Pack demo recargado: propiedades, reservas, mensajes y más."
      : "Pack demo cargado en tu cuenta.",
    properties,
    guests,
    reservations,
    conversations,
    tasks,
    notifications,
    knowledgeItems,
    adCampaigns,
  };
}
