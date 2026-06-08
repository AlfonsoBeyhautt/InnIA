"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";

type IntegrationRow = {
  id: string;
  provider: string;
  status: string;
  sync_status: string | null;
};

const EMPTY: IntegrationRow[] = [];

const channels = [
  { provider: "booking", label: "Booking" },
  { provider: "airbnb", label: "Airbnb" },
  { provider: "whatsapp_business", label: "WhatsApp" },
  { provider: "instagram", label: "Instagram" },
] as const;

export function HomeIntegrations() {
  const { user } = useSession();
  const { data } = useApi<IntegrationRow[]>(user ? "/api/integrations" : null, EMPTY);
  const rows = data ?? EMPTY;
  const isConnected = (provider: string) =>
    rows.some((row) => row.provider === provider && row.status === "connected");
  const connected = channels.filter((channel) => isConnected(channel.provider));
  const hasIssue = channels.some((channel) => !isConnected(channel.provider));
  const statusLabel = hasIssue ? "Revisar conexión" : "Canales operativos";

  return (
    <section className="flex h-full min-h-[190px] flex-col rounded-[20px] border border-border/65 bg-card/95 p-3 shadow-[0_14px_40px_-34px_rgba(46,58,42,0.42),0_1px_0_rgba(255,255,255,0.82)_inset] max-lg:rounded-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Integraciones
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {hasIssue ? (
              <CircleAlert className="h-3.5 w-3.5 text-terracotta" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            )}
            {statusLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {connected.length}
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            de 4
          </p>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center rounded-2xl border border-border/55 bg-white px-1.5 py-1">
        <Image
          src="/integrations-logos.png"
          alt="Booking, Airbnb, WhatsApp e Instagram"
          width={1024}
          height={576}
          className="h-full max-h-[132px] w-full object-contain"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {channels.map((channel) => {
            const active = isConnected(channel.provider);
            return (
              <span
                key={channel.provider}
                className={
                  active
                    ? "rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-semibold text-success"
                    : "rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[9px] font-semibold text-terracotta"
                }
              >
                {channel.label}: {active ? "ok" : "falta"}
              </span>
            );
          })}
        </div>
        <Link
          href="/app/configuracion?section=integraciones"
          className="inline-flex shrink-0 rounded-xl border border-border/70 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-sand/70 hover:text-foreground"
        >
          Gestionar
        </Link>
      </div>
    </section>
  );
}
