"use client";

import { useMemo } from "react";
import { useProperty } from "@/context/property-context";
import { filterByProperty } from "@/lib/utils";
import { lockAccessHistory, smartLocks } from "@/data/mock";
import { SmartLockCard } from "@/components/locks/smart-lock-card";

export default function CerradurasPage() {
  const { selectedProperty } = useProperty();
  const filtered = useMemo(
    () => filterByProperty(smartLocks, selectedProperty),
    [selectedProperty]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Cerraduras inteligentes</h1>
        <p className="text-muted-foreground">Códigos, accesos y estado de cada cerradura.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lock) => (
          <SmartLockCard key={lock.id} lock={lock} />
        ))}
      </div>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-semibold">Historial de accesos</h2>
        <ul className="space-y-3 text-sm">
          {lockAccessHistory.map((e) => (
            <li key={e.id} className="flex justify-between border-b border-border pb-3 last:border-0">
              <span>{e.guest} — {e.action}</span>
              <span className="text-muted-foreground">{e.timestamp}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
