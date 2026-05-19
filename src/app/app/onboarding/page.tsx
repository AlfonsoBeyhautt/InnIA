"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Bot, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPatch } from "@/lib/hooks/use-api";

const steps = [
  {
    icon: BedDouble,
    title: "Tu primera propiedad",
    desc: "Cargá alojamientos, unidades, WiFi y reglas para que la IA responda con datos reales.",
  },
  {
    icon: Link2,
    title: "Conectar canales",
    desc: "Sincronizá Airbnb, Booking, WhatsApp y email desde Configuración → Integraciones.",
  },
  {
    icon: Bot,
    title: "Activar asistente IA",
    desc: "Completá la base de conocimiento y activá respuestas automáticas en el Centro de mensajes.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await apiPatch("/api/profile", { onboarding_completed: true });
    } catch {
      // continue to app even if API unavailable
    }
    router.push("/app/inicio");
    router.refresh();
  };

  const current = steps[step]!;
  const Icon = current.icon;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Configuración inicial · {step + 1}/{steps.length}
        </p>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{current.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{current.desc}</p>

        <div className="mt-8 flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Anterior
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button className="ml-auto" onClick={() => setStep((s) => s + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button className="ml-auto" onClick={finish} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ir al panel"}
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary"
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  );
}
