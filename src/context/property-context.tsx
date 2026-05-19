"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PropertyId } from "@/types";

type PropertyContextValue = {
  selectedProperty: PropertyId;
  setSelectedProperty: (id: PropertyId) => void;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyId>("all");

  return (
    <PropertyContext.Provider value={{ selectedProperty, setSelectedProperty }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}
