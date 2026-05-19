"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, MessageSquare, Send, X } from "lucide-react";
import type { Reservation } from "@/types";
import { formatCurrency, propertyName, unitName } from "@/lib/utils";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IntegrationRequiredDialog } from "@/components/shared/integration-required-dialog";
import { DEMO_PROPERTY_IDS } from "@/lib/demo/constants";
import { apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";

const statusLabel = {
  confirmada: { text: "Confirmada", variant: "success" as const },
  "check-in": { text: "Check-in", variant: "warning" as const },
  "check-out": { text: "Check-out", variant: "secondary" as const },
  pendiente: { text: "Pendiente", variant: "secondary" as const },
  cancelada: { text: "Cancelada", variant: "danger" as const },
};

type ReservationDetailPanelProps = {
  reservation: Reservation | null;
  dayLabel?: string;
  onClose?: () => void;
};

export function ReservationDetailPanel({
  reservation,
  dayLabel,
  onClose,
}: ReservationDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [integrationService, setIntegrationService] = useState("");

  if (!reservation) {
    return (
      <aside className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        {dayLabel ? (
          <>
            <p className="font-medium text-foreground">{dayLabel}</p>
            <p className="mt-1">Seleccioná una reserva en el calendario</p>
          </>
        ) : (
          <p>Seleccioná una reserva para ver el detalle</p>
        )}
      </aside>
    );
  }

  const st = statusLabel[reservation.status];

  const openIntegration = (service: string) => {
    setIntegrationService(service);
    setIntegrationOpen(true);
  };

  const createTask = async () => {
    try {
      await apiPost("/api/tasks", {
        propertyDbId:
          reservation.propertyDbId ??
          DEMO_PROPERTY_IDS[reservation.propertyId as keyof typeof DEMO_PROPERTY_IDS],
        title: `Check-out / limpieza — ${reservation.guestName}`,
        type: "limpieza",
        description: `Reserva ${reservation.checkIn} → ${reservation.checkOut}`,
        status: "Pendiente",
      });
      toast("Tarea de limpieza creada.", "success");
    } catch {
      toast("No se pudo crear la tarea.", "error");
    }
  };

  return (
    <>
      <aside className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
        <div className="flex items-start justify-between border-b border-border/70 bg-sand/60 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Reserva
            </p>
            <h3 className="font-semibold text-foreground">{reservation.guestName}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PlatformBadge platform={reservation.platform} />
              <Badge variant={st.variant}>{st.text}</Badge>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Propiedad</p>
              <p className="font-medium">{propertyName(reservation.propertyId)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Unidad / apartamento
              </p>
              <p className="font-medium">{unitName(reservation.unitId)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Check-in</p>
                <p className="font-medium">{reservation.checkIn}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Check-out</p>
                <p className="font-medium">{reservation.checkOut}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Huéspedes</p>
                <p className="font-medium">{reservation.guestCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Pago</p>
                <p className="font-medium capitalize">{reservation.paymentStatus}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Código cerradura</p>
              <p className="flex items-center gap-1 font-medium capitalize">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                {reservation.lockCodeStatus}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Monto</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(reservation.amount)}
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-2 border-t border-border/70 bg-sand/60/80 p-3">
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
            <Link href="/app/inbox">
              <MessageSquare className="h-4 w-4" />
              Ver conversación
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => openIntegration("guía de check-in por email")}
          >
            <Send className="h-4 w-4" />
            Enviar guía
          </Button>
          <Button
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => openIntegration("cerradura inteligente")}
          >
            <KeyRound className="h-4 w-4" />
            Generar código
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => void createTask()}
          >
            Crear tarea de limpieza
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push("/app/crm")}
          >
            Ver huésped en base de datos
          </Button>
        </div>
      </aside>

      <IntegrationRequiredDialog
        open={integrationOpen}
        onOpenChange={setIntegrationOpen}
        service={integrationService}
      />
    </>
  );
}
