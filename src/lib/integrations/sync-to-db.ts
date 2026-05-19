import { getAdapter } from "@/lib/integrations";
import { requireAuth } from "@/lib/auth/session";
import { createNotification, upsertIntegration } from "@/lib/db/mutations";
import type { IntegrationProvider } from "@/lib/supabase/types";
import type { SyncResult } from "@/lib/integrations/types";
import { guests as mockGuests, conversations as mockConversations, reservations as mockReservations } from "@/data/mock";

/**
 * Imports mock adapter data into Supabase for demo / until real APIs connect.
 */
export async function syncProviderToDatabase(
  provider: IntegrationProvider
): Promise<SyncResult> {
  const adapter = getAdapter(provider);
  const { supabase, user } = await requireAuth();
  const ownerId = user.id;
  const errors: string[] = [];
  let reservationsImported = 0;
  let messagesImported = 0;

  await upsertIntegration(provider, {
    status: "connected",
    sync_status: "syncing",
    last_sync_at: new Date().toISOString(),
    error_message: null,
  });

  const { data: properties } = await supabase
    .from("properties")
    .select("id, slug")
    .eq("owner_id", ownerId);

  const slugToId = new Map((properties ?? []).map((p) => [p.slug, p.id]));

  const { data: units } = await supabase.from("units").select("id, slug, property_id");
  const unitBySlug = new Map((units ?? []).map((u) => [u.slug, u.id]));

  // Guests
  for (const g of mockGuests.slice(0, 5)) {
    const { error } = await supabase.from("guests").upsert(
      {
        owner_id: ownerId,
        full_name: g.fullName,
        email: g.email,
        phone: g.phone,
        document_number: g.documentId,
        nationality: g.nationality,
        origin_platform: g.originPlatform,
        validation_status: g.validationStatus,
        marketing_consent: g.marketingConsent,
        preferences: g.preferences ?? [],
        internal_notes: g.internalNotes,
        tags: g.tags,
        preferred_property_slug: g.preferredPropertyId,
        rental_data: g.rentalData as unknown as import("@/lib/supabase/types").Json,
        incidents: g.incidents as unknown as import("@/lib/supabase/types").Json,
        reviews: g.reviews as unknown as import("@/lib/supabase/types").Json,
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (error) errors.push(`guest: ${error.message}`);
  }

  const resSync = await adapter.syncReservations();
  for (const r of mockReservations) {
    const propertyDbId = slugToId.get(r.propertyId);
    const unitDbId = unitBySlug.get(r.unitId);
    if (!propertyDbId || !unitDbId) continue;

    const { data: guestRow } = await supabase
      .from("guests")
      .select("id")
      .eq("owner_id", ownerId)
      .ilike("full_name", `%${r.guestName.split(" ")[0]}%`)
      .limit(1)
      .maybeSingle();

    if (!guestRow) continue;

    const { error } = await supabase.from("reservations").upsert(
      {
        guest_id: guestRow.id,
        property_id: propertyDbId,
        unit_id: unitDbId,
        platform: r.platform,
        check_in: r.checkIn,
        check_out: r.checkOut,
        status: r.status,
        payment_status: r.paymentStatus,
        total_amount: r.amount,
        guests_count: r.guestCount,
        lock_code_status: r.lockCodeStatus,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (!error) reservationsImported++;
    else if (error.code !== "23P01") errors.push(`reservation: ${error.message}`);
  }

  const msgSync = await adapter.syncMessages();
  for (const c of mockConversations) {
    const propertyDbId = slugToId.get(c.propertyId);
    if (!propertyDbId) continue;

    const { data: guestRow } = await supabase
      .from("guests")
      .select("id")
      .eq("owner_id", ownerId)
      .ilike("full_name", `%${c.guestName.split(" ")[0]}%`)
      .limit(1)
      .maybeSingle();

    if (!guestRow) continue;

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .upsert(
        {
          owner_id: ownerId,
          guest_id: guestRow.id,
          property_id: propertyDbId,
          channel: c.platform,
          priority: c.urgency === "urgente" ? "urgente" : c.urgency === "revisar" ? "revisar" : "normal",
          labels: c.labels,
          sentiment: c.sentiment,
          last_message_preview: c.lastMessage,
          unread: c.unread,
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      .select()
      .single();

    if (convErr || !conv) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("guest_id", guestRow.id)
        .eq("property_id", propertyDbId)
        .limit(1)
        .maybeSingle();

      const convId = existing?.id;
      if (!convId) continue;

      for (const m of c.messages) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_type: m.sender,
          body: m.content,
          ai_generated: m.sender === "ai",
        });
      }
      messagesImported += c.messages.length;
      continue;
    }

    for (const m of c.messages) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: m.sender,
        body: m.content,
        ai_generated: m.sender === "ai",
      });
    }
    messagesImported += c.messages.length;
  }

  void resSync;
  void msgSync;

  await upsertIntegration(provider, {
    status: "connected",
    sync_status: errors.length ? "partial" : "ok",
    last_sync_at: new Date().toISOString(),
    error_message: errors[0] ?? null,
  });

  await createNotification({
    type: "integracion",
    title: `Sincronización ${provider}`,
    body: `${reservationsImported} reservas y ${messagesImported} mensajes importados.`,
  });

  return {
    provider,
    reservationsImported,
    messagesImported,
    errors,
  };
}
