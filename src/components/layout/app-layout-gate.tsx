"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBootstrap } from "@/components/layout/demo-bootstrap";
import { PropertyProvider } from "@/context/property-context";
import { ToastProvider } from "@/context/toast-context";

export function AppLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/app/onboarding");

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <PropertyProvider>
        <DemoBootstrap />
        <AppShell>{children}</AppShell>
      </PropertyProvider>
    </ToastProvider>
  );
}
