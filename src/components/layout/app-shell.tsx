"use client";

import { useState } from "react";
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DesktopSidebar />
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <AppSidebar mobile onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className={cn("flex-1")}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
