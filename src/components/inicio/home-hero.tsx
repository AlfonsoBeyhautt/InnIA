"use client";

import Link from "next/link";
import { CalendarDays, ListTodo, MessageCircle, Sparkles } from "lucide-react";
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

  const quickLinks = [
    { label: "Reservas", href: "/app/reservas", icon: CalendarDays },
    { label: "Inbox", href: "/app/inbox", icon: MessageCircle },
    { label: "Tareas", href: "/app/operaciones", icon: ListTodo },
  ];

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(135deg,#fffdf8_0%,#f7f1e8_56%,#eee4d5_100%)] px-4 py-3.5 shadow-[0_20px_54px_-44px_rgba(46,58,42,0.55),0_1px_0_rgba(255,255,255,0.92)_inset] max-lg:rounded-2xl lg:px-5 lg:py-4">
      <div className="pointer-events-none absolute -right-24 -top-28 h-52 w-52 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-56 w-56 rounded-full bg-terracotta/10 blur-3xl" />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat("es-UY", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </div>
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {name && !profileLoading
              ? `Buen día, ${name}.`
              : "Buen día."}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-xs font-semibold text-foreground shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] transition-colors hover:bg-sand/70"
            >
              <item.icon className="h-3.5 w-3.5 text-primary" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
