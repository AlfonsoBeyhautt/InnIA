import { AppLayoutGate } from "@/components/layout/app-layout-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutGate>{children}</AppLayoutGate>;
}
