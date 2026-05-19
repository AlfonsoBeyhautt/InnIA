import { requireAuth } from "@/lib/auth/session";
import { mapGuest, mapReservation, mapTask } from "@/lib/db/mappers";
import type { PropertyId } from "@/types";
import type { Tables } from "@/lib/supabase/types";

export type SearchResultGroup = {
  type: "guest" | "property" | "reservation" | "conversation" | "task";
  label: string;
  items: SearchResultItem[];
};

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type ReservationRow = Tables<"reservations"> & {
  guest?: { full_name: string } | null;
  property?: { slug: string; name: string; owner_id: string } | null;
  unit?: { slug: string } | null;
};

export async function globalSearch(query: string): Promise<SearchResultGroup[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const { supabase, user } = await requireAuth();
  const ownerId = user.id;

  const { data: properties } = await supabase
    .from("properties")
    .select("id, slug, name, location")
    .eq("owner_id", ownerId);

  const propertyIds = (properties ?? []).map((p) => p.id);

  const [guestsRes, convRes, tasksRes, reservationsRes] = await Promise.all([
    supabase.from("guests").select("*").eq("owner_id", ownerId).limit(200),
    supabase
      .from("conversations")
      .select("id, last_message_preview, guest:guests(full_name), property:properties(slug, name)")
      .eq("owner_id", ownerId)
      .limit(100),
    supabase
      .from("operation_tasks")
      .select("*, property:properties(slug)")
      .eq("owner_id", ownerId)
      .limit(100),
    propertyIds.length > 0
      ? supabase
          .from("reservations")
          .select("*, guest:guests(full_name), property:properties(slug), unit:units(slug)")
          .in("property_id", propertyIds)
          .limit(100)
      : Promise.resolve({ data: [] as ReservationRow[], error: null }),
  ]);

  const groups: SearchResultGroup[] = [];

  const guests = (guestsRes.data ?? [])
    .map((row) => mapGuest(row))
    .filter((g) => matchesGuest(g, q))
    .slice(0, 8);
  if (guests.length > 0) {
    groups.push({
      type: "guest",
      label: "Huéspedes",
      items: guests.map((g) => ({
        id: g.id,
        title: g.fullName,
        subtitle: g.email ?? g.phone ?? g.documentId ?? g.passportNumber,
        href: `/app/crm`,
      })),
    });
  }

  const props = (properties ?? [])
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    )
    .slice(0, 6);
  if (props.length > 0) {
    groups.push({
      type: "property",
      label: "Propiedades",
      items: props.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.location ?? undefined,
        href: `/app/propiedades`,
      })),
    });
  }

  const reservations = ((reservationsRes.data ?? []) as ReservationRow[])
    .filter((row) => matchesReservation(row, q))
    .slice(0, 8)
    .map((row) => mapReservation(row));

  if (reservations.length > 0) {
    groups.push({
      type: "reservation",
      label: "Reservas",
      items: reservations.map((r) => ({
        id: r.id,
        title: r.guestName,
        subtitle: `${r.checkIn} → ${r.checkOut} · ${r.platform}`,
        href: `/app/reservas`,
      })),
    });
  }

  type ConversationRow = Tables<"conversations"> & {
    guest?: { full_name: string } | null;
    property?: { slug: string; name: string } | null;
  };

  const conversations = ((convRes.data ?? []) as ConversationRow[])
    .filter((c) => {
      const name = c.guest?.full_name?.toLowerCase() ?? "";
      const preview = c.last_message_preview?.toLowerCase() ?? "";
      const prop = c.property?.name?.toLowerCase() ?? "";
      return name.includes(q) || preview.includes(q) || prop.includes(q);
    })
    .slice(0, 8);

  if (conversations.length > 0) {
    groups.push({
      type: "conversation",
      label: "Conversaciones",
      items: conversations.map((c) => ({
        id: c.id,
        title: c.guest?.full_name ?? "Conversación",
        subtitle: c.last_message_preview ?? c.property?.name ?? undefined,
        href: `/app/inbox`,
      })),
    });
  }

  type TaskRow = Tables<"operation_tasks"> & { property?: { slug: string } | null };
  const tasks = ((tasksRes.data ?? []) as TaskRow[])
    .filter((t) => {
      const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8);

  if (tasks.length > 0) {
    groups.push({
      type: "task",
      label: "Tareas",
      items: tasks.map((t) => {
        const mapped = mapTask(t, (t.property?.slug ?? "pdd") as PropertyId);
        return {
          id: mapped.id,
          title: mapped.title,
          subtitle: `${mapped.status} · ${mapped.type}`,
          href: `/app/operaciones`,
        };
      }),
    });
  }

  return groups;
}

function matchesGuest(
  g: ReturnType<typeof mapGuest>,
  q: string
): boolean {
  return (
    g.fullName.toLowerCase().includes(q) ||
    (g.email?.toLowerCase().includes(q) ?? false) ||
    (g.phone?.includes(q) ?? false) ||
    (g.documentId?.toLowerCase().includes(q) ?? false) ||
    (g.passportNumber?.toLowerCase().includes(q) ?? false)
  );
}

function matchesReservation(row: ReservationRow, q: string): boolean {
  const guestName = row.guest?.full_name?.toLowerCase() ?? "";
  const platform = row.platform?.toLowerCase() ?? "";
  const slug = row.property?.slug?.toLowerCase() ?? "";
  return guestName.includes(q) || platform.includes(q) || slug.includes(q);
}
