"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { useSidebar } from "@/context/sidebar-context";
import { useSession } from "@/lib/hooks/use-session";
import { useApi } from "@/lib/hooks/use-api";
import type { AppStats } from "@/lib/db/app-stats";

type AppSidebarProps = {
  onNavigate?: () => void;
  mobile?: boolean;
};

type ProfileResponse = {
  profile: { full_name: string | null } | null;
  user: { email: string | null } | null;
};

export function AppSidebar({ onNavigate, mobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { expanded } = useSidebar();
  const showLabels = mobile || expanded;
  const { user } = useSession();
  const { data: profile } = useApi<ProfileResponse>(user ? "/api/profile" : null, undefined, {
    enabled: Boolean(user),
  });
  const { data: stats } = useApi<AppStats>(user ? "/api/stats" : null, undefined, {
    enabled: Boolean(user),
  });

  const displayName =
    profile?.profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  return (
    <aside
      className={cn(
        "ci-sidebar flex h-full shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        mobile ? "w-[260px]" : showLabels ? "w-[260px]" : "w-[72px]"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-cream/10",
          showLabels ? "gap-2.5 px-4" : "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream/15 text-cream">
          <Home className="h-4 w-4" />
        </div>
        {showLabels && (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate font-semibold text-cream">InnIA</p>
            <p className="truncate text-[11px] text-cream/60">Gestión de alquileres</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const badge =
              item.href === "/app/inbox" && stats && stats.unreadConversations > 0
                ? String(stats.unreadConversations)
                : item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={!showLabels ? item.title : undefined}
                className={cn(
                  "relative flex items-center rounded-xl text-sm font-medium",
                  showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5",
                  active ? "ci-sidebar-nav-active" : "ci-sidebar-nav-idle"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {showLabels && (
                  <>
                    <span className="flex-1 truncate">{item.title}</span>
                    {badge && (
                      <Badge className="h-5 min-w-5 justify-center border-0 bg-cream/20 px-1.5 text-[10px] text-cream">
                        {badge}
                      </Badge>
                    )}
                  </>
                )}
                {!showLabels && badge && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cream/25 px-0.5 text-[9px] font-bold text-cream">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {showLabels && (
        <div className="shrink-0 border-t border-cream/10 p-3">
          <Link
            href="/app/configuracion"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-cream/10"
          >
            <Avatar className="h-9 w-9 border border-cream/20">
              <AvatarFallback className="bg-cream/15 text-xs text-cream">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">{displayName}</p>
              <p className="text-xs text-cream/55">Ver perfil</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
