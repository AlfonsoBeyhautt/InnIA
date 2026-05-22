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
      <div className="flex min-h-[100dvh] bg-background lg:min-h-screen">
        <DesktopSidebar />
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[min(80vw,280px)] max-w-[280px] shadow-2xl lg:hidden">
              <AppSidebar mobile onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className={cn("min-h-0 flex-1 overflow-x-hidden")}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
