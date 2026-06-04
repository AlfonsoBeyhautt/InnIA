"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";

function DesktopSidebar() {
  const { setHovered } = useSidebar();

  return (
    <div
      className="relative hidden shrink-0 lg:block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AppSidebar />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <SidebarProvider>
      <div className="relative flex min-h-[100dvh] overflow-hidden bg-background lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(196,120,90,0.08),transparent_28rem),radial-gradient(circle_at_30%_100%,rgba(83,99,67,0.1),transparent_34rem)]" />
        <DesktopSidebar />
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#1f281d]/45 backdrop-blur-[3px] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[min(80vw,280px)] max-w-[280px] shadow-[18px_0_60px_-28px_rgba(0,0,0,0.55)] lg:hidden">
              <AppSidebar mobile onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className={cn("min-h-0 flex-1 overflow-x-hidden")}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
