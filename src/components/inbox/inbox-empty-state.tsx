"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks/use-api";

type IntegrationRow = {
  provider: string;
  status: string;
};

export function InboxEmptyState() {
  const { data } = useApi<IntegrationRow[]>("/api/integrations", []);
  const rows = data ?? [];
  const whatsapp = rows.find(
    (r) => r.provider === "whatsapp_business" && r.status === "connected"
  );
  const email = rows.find((r) => r.provider === "email" && r.status === "connected");

  if (whatsapp || email) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        No hay conversaciones todavía. Los mensajes de WhatsApp o Email aparecerán aquí.
      </p>
    );
  }

  return (
    <div className="m-4 rounded-xl border border-dashed border-border/80 bg-sand/40 p-6 text-center">
      <MessageCircle className="mx-auto h-8 w-8 text-primary/70" />
      <p className="mt-3 text-sm font-medium text-foreground">Centralizá tus mensajes</p>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        Conectá WhatsApp Business o Email para empezar a recibir mensajes de huéspedes en un solo
        lugar.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Airbnb y Booking: calendario iCal disponible · mensajes requieren integración avanzada
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link href="/app/configuracion">Conectar canales</Link>
      </Button>
    </div>
  );
}
