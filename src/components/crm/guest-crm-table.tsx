"use client";

import type { Guest } from "@/types";
import { propertyName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";

export function GuestCRMTable({ guests }: { guests: Guest[] }) {
  return (
    <div className="card-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3">Huésped</th>
            <th className="px-5 py-3">Estadías</th>
            <th className="px-5 py-3">Propiedad preferida</th>
            <th className="px-5 py-3">Etiquetas</th>
            <th className="px-5 py-3">Consentimiento</th>
            <th className="px-5 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {guests.map((g) => (
            <tr key={g.id} className="hover:bg-muted/20">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(g.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">Última: {g.lastStay}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">{g.totalStays}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {g.preferredPropertyId ? propertyName(g.preferredPropertyId) : "—"}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1">
                  {g.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4">
                <Badge variant={g.marketingConsent ? "success" : "secondary"}>
                  {g.marketingConsent ? "Sí" : "No"}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Enviar oferta directa
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
