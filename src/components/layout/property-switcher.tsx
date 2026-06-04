"use client";

import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { useProperty } from "@/context/property-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PropertyId } from "@/types";

export function PropertySwitcher() {
  const {
    selectedProperty,
    setSelectedProperty,
    properties,
    loading,
    resolvePropertyName,
  } = useProperty();

  const options = [
    { id: "all" as PropertyId, name: "Todas las propiedades" },
    ...properties,
  ];
  const current = options.find((p) => p.id === selectedProperty);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 max-w-[min(52vw,200px)] gap-1.5 rounded-xl border-border/75 bg-card/75 px-2.5 font-normal shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] sm:max-w-none sm:gap-2 sm:px-3"
        >
          <Building2 className="h-4 w-4 shrink-0 text-olive" />
          <span className="min-w-0 flex-1 truncate text-left text-xs sm:text-sm">
            {loading && properties.length === 0 ? (
              <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
            ) : (
              current?.name ?? resolvePropertyName(selectedProperty)
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[320px] overflow-y-auto">
        <DropdownMenuLabel>Propiedades</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setSelectedProperty(p.id)}
            className="justify-between"
          >
            <span className="truncate">{p.name}</span>
            {selectedProperty === p.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
        {!loading && properties.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            Sin propiedades. Agregá una desde Configuración o Propiedades.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
