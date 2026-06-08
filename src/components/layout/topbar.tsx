"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, LogOut, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlobalSearch } from "@/components/layout/global-search";
import { PropertySwitcher } from "@/components/layout/property-switcher";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import type { AppNotification } from "@/data/mock/notifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";

type TopbarProps = { onMenuClick?: () => void };

type ProfileResponse = {
  user: { id: string; email: string | null } | null;
  profile: {
    full_name: string | null;
    email: string | null;
    plan: string;
  } | null;
};

type DbNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
};

const EMPTY_NOTIFICATIONS: DbNotification[] = [];

function mapNotification(row: DbNotification): AppNotification {
  const categoryMap: Record<string, AppNotification["category"]> = {
    mensaje: "mensaje",
    reserva: "reserva",
    ia: "ia",
    integracion: "operaciones",
    tarea: "tarea",
  };
  return {
    id: row.id,
    title: row.title,
    description: row.body,
    timestamp: new Date(row.created_at).toLocaleString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }),
    category: categoryMap[row.type] ?? "operaciones",
    read: row.read,
    href: row.type === "mensaje" ? "/app/inbox" : undefined,
  };
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleUnauthorized = useCallback(() => {
    router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [router]);

  const notificationsUrl = user ? "/api/notifications" : null;
  const profileUrl = user ? "/api/profile" : null;

  const { data, refetch, unauthorized } = useApi<DbNotification[]>(
    notificationsUrl,
    EMPTY_NOTIFICATIONS,
    { enabled: Boolean(user), onUnauthorized: handleUnauthorized }
  );

  const { data: profileData, loading: profileLoading } = useApi<ProfileResponse>(
    profileUrl,
    undefined,
    { enabled: Boolean(user), onUnauthorized: handleUnauthorized }
  );

  const displayName =
    profileData?.profile?.full_name?.trim() ||
    profileData?.user?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "Usuario";
  const email =
    profileData?.user?.email ?? profileData?.profile?.email ?? user?.email ?? "";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const onReady = () => void refetch();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetch]);

  const items: AppNotification[] = useMemo(() => {
    if (!user || unauthorized) return [];
    if (data && data.length > 0) return data.map(mapNotification);
    return [];
  }, [data, user, unauthorized]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unauthorized) return;
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) refetch();
  };

  const markRead = async (id: string) => {
    if (!user || unauthorized) return;
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) refetch();
  };

  return (
    <header className="ci-app-chrome-h sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-border/80 bg-[#fbf8f1]/92 px-3 backdrop-blur-xl max-lg:pt-[env(safe-area-inset-top,0px)] sm:gap-3 sm:px-4 lg:h-16 lg:gap-3 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="ci-touch-target shrink-0 lg:hidden"
        onClick={onMenuClick}
        aria-label="Menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <PropertySwitcher />

      <GlobalSearch className="relative ml-auto hidden min-w-0 flex-1 md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative ml-auto border border-transparent text-muted-foreground hover:border-border/80 hover:bg-white hover:text-foreground sm:ml-0",
              unread > 0 && "text-primary"
            )}
            aria-label="Notificaciones"
            disabled={sessionLoading}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-danger px-1 text-[10px] font-bold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-0" sideOffset={8}>
          <NotificationsPanel
            items={items}
            onMarkAllRead={markAllRead}
            onMarkRead={markRead}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-2 border border-transparent pl-2 pr-1 hover:border-border/80 hover:bg-white"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/10">
                {sessionLoading || profileLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  getInitials(displayName)
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium text-foreground">{displayName}</p>
            {email && (
              <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app/configuracion">Configuración</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-danger focus:text-danger"
          >
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
