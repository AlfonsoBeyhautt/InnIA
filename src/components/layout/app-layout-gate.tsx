"use client";

import { usePathname } from "next/navigation";
import { AppAuthGuard } from "@/components/layout/app-auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyProvider } from "@/context/property-context";
import { ToastProvider } from "@/context/toast-context";

export function AppLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/app/onboarding");

  if (isOnboarding) {
    return (
      <AppAuthGuard>
        <ToastProvider>{children}</ToastProvider>
      </AppAuthGuard>
    );
  }

  return (
    <AppAuthGuard>
      <ToastProvider>
        <PropertyProvider>
          <AppShell>{children}</AppShell>
        </PropertyProvider>
      </ToastProvider>
    </AppAuthGuard>
  );
}
