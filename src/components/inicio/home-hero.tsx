"use client";

import { CalendarDays, MessageCircle, Sparkles } from "lucide-react";
import { useSession } from "@/lib/hooks/use-session";
import { useApi } from "@/lib/hooks/use-api";

type ProfileResponse = {
  profile: { full_name: string | null } | null;
  user: { email: string | null } | null;
};

function firstName(profile: ProfileResponse | null, email?: string | null): string | null {
  const full = profile?.profile?.full_name?.trim();
  if (full) return full.split(" ")[0];
  if (email) return email.split("@")[0];
  return null;
}

export function HomeHero() {
  const { user, loading: sessionLoading } = useSession();
  const { data: profile, loading: profileLoading } = useApi<ProfileResponse>(
    user ? "/api/profile" : null,
    undefined,
    { enabled: Boolean(user) }
  );

  if (sessionLoading || !user) {
    return null;
  }

  const name = firstName(profile ?? null, user.email);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,#fffdf8_0%,#faf7f2_44%,#eee4d5_100%)] px-5 py-5 shadow-[0_28px_70px_-46px_rgba(46,58,42,0.52),0_1px_0_rgba(255,255,255,0.95)_inset] max-lg:rounded-2xl lg:px-8 lg:py-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-terracotta/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat("es-UY", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl xl:text-[2.15rem]">
            {name && !profileLoading
              ? `Buen día, ${name}.`
              : "Buen día."}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">
            InnIA mantiene mensajes, reservas y tareas operativas ordenadas para que puedas
            gestionar tus alojamientos con menos fricción.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {[
            { label: "Mensajes", value: "IA lista", icon: MessageCircle },
            { label: "Reservas", value: "Calendario", icon: CalendarDays },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-[132px] rounded-2xl border border-border/60 bg-card/70 px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
            >
              <div className="flex items-center gap-2 text-primary">
                <item.icon className="h-4 w-4" />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
