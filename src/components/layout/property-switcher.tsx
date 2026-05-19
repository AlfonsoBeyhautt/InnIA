"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useProperty } from "@/context/property-context";
import { PROPERTY_OPTIONS } from "@/lib/utils";
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
  const { selectedProperty, setSelectedProperty } = useProperty();
  const current = PROPERTY_OPTIONS.find((p) => p.id === selectedProperty);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 rounded-xl border-border/80 bg-card font-normal shadow-sm">
          <Building2 className="h-4 w-4 text-olive" />
          <span className="max-w-[180px] truncate hidden sm:inline">{current?.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Propiedades</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROPERTY_OPTIONS.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setSelectedProperty(p.id as PropertyId)}
            className="justify-between"
          >
            {p.name}
            {selectedProperty === p.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
