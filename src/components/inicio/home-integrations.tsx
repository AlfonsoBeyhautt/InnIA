"use client";

import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const integrations = [
  { name: "Airbnb", color: "bg-[#FF5A5F]/10 text-[#c44a4e]" },
  { name: "Booking", color: "bg-[#003580]/10 text-[#003580]" },
  { name: "WhatsApp", color: "bg-emerald-50 text-emerald-700" },
  { name: "Email", color: "bg-sand text-muted-foreground" },
];

export function HomeIntegrations() {
  return (
    <section className="flex h-full min-h-[180px] flex-col justify-between gap-4 rounded-[20px] border border-border/70 bg-card p-5 shadow-[0_2px_16px_-6px_rgba(62,79,60,0.08)]">
      <div>
        <h2 className="ci-section-title">Integraciones</h2>
        <p className="ci-section-sub flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          Todo funcionando correctamente
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {integrations.map((i) => (
            <span
              key={i.name}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${i.color}`}
            >
              {i.name}
            </span>
          ))}
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
        <Link href="/app/configuracion">
          <Mail className="h-4 w-4" />
          Gestionar
        </Link>
      </Button>
    </section>
  );
}
