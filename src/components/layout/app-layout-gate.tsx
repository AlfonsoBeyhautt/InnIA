"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DemoBootstrap } from "@/components/layout/demo-bootstrap";
import { PropertyProvider } from "@/context/property-context";

export function AppLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/app/onboarding");

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <PropertyProvider>
      <DemoBootstrap />
      <AppShell>{children}</AppShell>
    </PropertyProvider>
  );
}
