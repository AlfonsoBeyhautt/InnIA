"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/hooks/use-session";

type AppAuthGuardProps = {
  children: React.ReactNode;
};

/**
 * Client-side backup: no render app chrome until Supabase session exists.
 */
export function AppAuthGuard({ children }: AppAuthGuardProps) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const redirect = pathname.startsWith("/app")
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : "/login";
    router.replace(redirect);
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
