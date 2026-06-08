"use client";

import Link from "next/link";
import { CalendarDays, ListTodo, MessageCircle } from "lucide-react";
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
    <section className="border-b border-border/80 pb-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {new Intl.DateTimeFormat("es-UY", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            {name && !profileLoading
              ? `Buen día, ${name}.`
              : "Buen día."}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Centro operativo para revisar llegadas, conversaciones y tareas antes de que
            impacten la experiencia del huésped.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-white px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-sand/50"
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
