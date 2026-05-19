"use client";

import Link from "next/link";
import { Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeDailyTip() {
  return (
    <aside className="relative overflow-hidden rounded-[22px] bg-olive p-6 text-cream shadow-[0_8px_32px_-10px_rgba(62,79,60,0.35)]">
      <Leaf className="absolute -bottom-2 -right-2 h-24 w-24 text-cream/10" aria-hidden />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-cream/80">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Consejo del día
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-[#e8dcc8]">
            Responde rápido a los mensajes
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-cream/85">
            Los huéspedes valoran respuestas en menos de 30 minutos. Tu asistente IA puede
            ayudarte con consultas frecuentes mientras vos te enfocás en lo importante.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-fit rounded-xl border-cream/30 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
        >
          <Link href="/app/reportes">Ver reportes</Link>
        </Button>
      </div>
    </aside>
  );
}
