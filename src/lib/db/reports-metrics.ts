import { requireAuth } from "@/lib/auth/session";

export type ReportsMetrics = {
  instagramInquiries: number;
  instagramReservations: number;
  aiAutoReplies: number;
  activeCampaigns: number;
  commercialProposals: number;
  convertedInquiries: number;
  topChannels: { channel: string; count: number }[];
  frequentQuestions: { topic: string; count: number }[];
};

export async function getReportsMetrics(): Promise<ReportsMetrics> {
  const { supabase, user } = await requireAuth();
  const userId = user.id;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, channel, intent_category, reservation_id, last_message_preview")
    .eq("owner_id", userId);

  const convs = conversations ?? [];

  const instagramInquiries = convs.filter(
    (c) => c.channel === "instagram" && c.intent_category === "nueva_consulta"
  ).length;

  const instagramReservations = convs.filter(
    (c) => c.channel === "instagram" && c.reservation_id
  ).length;

  const commercialProposals = convs.filter(
    (c) => c.intent_category === "comercial"
  ).length;

  const convertedInquiries = convs.filter(
    (c) => c.intent_category === "nueva_consulta" && c.reservation_id
  ).length;

  const channelCounts = new Map<string, number>();
  for (const c of convs) {
    const ch = c.channel ?? "otro";
    channelCounts.set(ch, (channelCounts.get(ch) ?? 0) + 1);
  }
  const topChannels = [...channelCounts.entries()]
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topicPatterns: { re: RegExp; topic: string }[] = [
    { re: /disponibil|fechas|enero|febrero/i, topic: "Disponibilidad y fechas" },
    { re: /precio|tarifa|cu[aá]nto/i, topic: "Precios" },
    { re: /mascota/i, topic: "Mascotas" },
    { re: /wifi/i, topic: "WiFi" },
    { re: /check-?in|llegada/i, topic: "Check-in" },
    { re: /estacionamiento|parking/i, topic: "Estacionamiento" },
  ];

  const topicCounts = new Map<string, number>();
  for (const c of convs) {
    const text = c.last_message_preview ?? "";
    for (const { re, topic } of topicPatterns) {
      if (re.test(text)) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
        break;
      }
    }
  }
  const frequentQuestions = [...topicCounts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const { count: aiAutoCount } = await supabase
    .from("messages")
    .select("id, conversations!inner(owner_id)", { count: "exact", head: true })
    .eq("ai_auto_sent", true)
    .eq("conversations.owner_id", userId);

  const { count: activeCampaigns } = await supabase
    .from("ad_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .in("status", ["borrador", "listo_para_publicar"]);

  return {
    instagramInquiries,
    instagramReservations,
    aiAutoReplies: aiAutoCount ?? 0,
    activeCampaigns: activeCampaigns ?? 0,
    commercialProposals,
    convertedInquiries,
    topChannels,
    frequentQuestions,
  };
}
