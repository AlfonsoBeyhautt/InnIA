"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeOpsSnapshot() {
  return (
    <section className="flex h-full flex-col justify-between rounded-[20px] border border-border/70 bg-olive p-5 text-cream shadow-[0_4px_20px_-8px_rgba(62,79,60,0.2)]">
      <div>
        <div className="mb-2 flex items-center gap-2 text-cream/75">
          <Sparkles className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Recomendación IA
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug">
          Responde en menos de 30 minutos
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-cream/80">
          Los huéspedes valoran respuestas rápidas. Tu asistente puede cubrir consultas frecuentes
          mientras vos priorizás lo urgente.
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-4 w-fit rounded-xl border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
      >
        <Link href="/app/reportes">Ver reportes</Link>
      </Button>
    </section>
  );
}
