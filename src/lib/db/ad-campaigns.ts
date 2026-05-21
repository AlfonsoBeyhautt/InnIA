import { requireAuth } from "@/lib/auth/session";
import type { AdCampaign, AdCampaignStatus } from "@/types";

type CampaignRow = {
  id: string;
  owner_id: string;
  property_id: string | null;
  name: string;
  objective: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  channel: string;
  ad_copy: string | null;
  cta: string | null;
  status: string;
  created_at: string;
  property?: { name: string } | null;
};

function mapCampaign(row: CampaignRow): AdCampaign {
  return {
    id: row.id,
    propertyId: row.property_id ?? undefined,
    propertyName: row.property?.name,
    name: row.name,
    objective: row.objective,
    budget: row.budget ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    channel: (row.channel as AdCampaign["channel"]) ?? "instagram",
    adCopy: row.ad_copy ?? undefined,
    cta: row.cta ?? undefined,
    status: row.status as AdCampaignStatus,
    createdAt: row.created_at,
  };
}

export async function listAdCampaigns(): Promise<AdCampaign[]> {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*, property:properties(name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapCampaign(r as CampaignRow));
}

export async function createAdCampaign(input: {
  name: string;
  objective: string;
  propertyId?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  channel?: string;
  adCopy?: string;
  cta?: string;
  status?: AdCampaignStatus;
}): Promise<AdCampaign> {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      owner_id: user.id,
      property_id: input.propertyId ?? null,
      name: input.name.trim(),
      objective: input.objective.trim(),
      budget: input.budget ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      channel: input.channel ?? "instagram",
      ad_copy: input.adCopy?.trim() ?? null,
      cta: input.cta?.trim() ?? null,
      status: input.status ?? "borrador",
    })
    .select("*, property:properties(name)")
    .single();

  if (error) throw error;
  return mapCampaign(data as CampaignRow);
}
