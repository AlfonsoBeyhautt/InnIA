import { requireAuth } from "@/lib/auth/session";

export type AppStats = {
  propertyCount: number;
  unitCount: number;
  unreadConversations: number;
  locksOnline: number;
  locksOffline: number;
};

export async function getAppStats(): Promise<AppStats> {
  const { supabase, user } = await requireAuth();
  const userId = user.id;

  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select("id, smart_lock_online")
    .eq("owner_id", userId);
  if (propErr) throw propErr;

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyCount = propertyIds.length;

  let unitCount = 0;
  if (propertyIds.length > 0) {
    const { count, error: unitErr } = await supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .in("property_id", propertyIds);
    if (unitErr) throw unitErr;
    unitCount = count ?? 0;
  }

  const { data: conversations, error: convErr } = await supabase
    .from("conversations")
    .select("unread, priority")
    .eq("owner_id", userId);
  if (convErr) throw convErr;

  const unreadConversations = (conversations ?? []).filter(
    (c) => c.unread || (c.priority && c.priority !== "normal")
  ).length;

  const locksOnline = (properties ?? []).filter((p) => p.smart_lock_online).length;
  const locksOffline = propertyCount - locksOnline;

  return {
    propertyCount,
    unitCount,
    unreadConversations,
    locksOnline,
    locksOffline,
  };
}
