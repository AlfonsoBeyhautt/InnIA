"use client";

import { useSession } from "@/lib/hooks/use-session";
import { useApi } from "@/lib/hooks/use-api";

type ProfileResponse = {
  profile: { full_name: string | null } | null;
  user: { email: string | null } | null;
};

function firstName(profile: ProfileResponse | null, email?: string | null) {
  const full = profile?.profile?.full_name?.trim();
  if (full) return full.split(" ")[0];
  if (email) return email.split("@")[0];
  return "Martín";
}

export function HomeHero() {
  const { user } = useSession();
  const { data: profile } = useApi<ProfileResponse>(user ? "/api/profile" : null, undefined, {
    enabled: Boolean(user),
  });

  const name = firstName(profile ?? null, user?.email);

  return (
    <section className="ci-card-compact max-lg:shadow-sm lg:rounded-[22px] lg:px-8 lg:py-7 lg:shadow-[0_4px_24px_-10px_rgba(62,79,60,0.1)]">
      <div className="max-w-2xl space-y-1 max-lg:space-y-0.5 lg:space-y-1.5">
        <p className="text-xs font-medium capitalize text-muted-foreground lg:text-sm">
          {new Intl.DateTimeFormat("es-UY", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground lg:text-2xl xl:text-[1.85rem]">
          ¡Qué bueno verte, {name}!
        </h1>
        <p className="text-sm text-muted-foreground lg:text-base">
          Tus propiedades, tus huéspedes, todo en armonía.
        </p>
      </div>
    </section>
  );
}
