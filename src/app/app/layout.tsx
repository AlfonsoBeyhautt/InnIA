import { redirect } from "next/navigation";
import { AppLayoutGate } from "@/components/layout/app-layout-gate";
import { isSupabaseConfigured } from "@/lib/config/env";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=supabase");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <AppLayoutGate>{children}</AppLayoutGate>;
}
