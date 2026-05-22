"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Property, PropertyId } from "@/types";

export type PropertyOption = { id: PropertyId; name: string; dbId?: string };

type PropertyContextValue = {
  selectedProperty: PropertyId;
  setSelectedProperty: (id: PropertyId) => void;
  properties: PropertyOption[];
  loading: boolean;
  refetchProperties: () => Promise<void>;
  resolvePropertyName: (id: PropertyId) => string;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyId>("all");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/properties");
      if (res.status === 401) {
        setProperties([]);
        return;
      }
      if (res.ok) {
        const rows = (await res.json()) as Property[];
        setProperties(
          rows.map((p) => ({
            id: (p.slug ?? p.id) as PropertyId,
            name: p.name,
            dbId: p.dbId,
          }))
        );
      }
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchProperties();
  }, [refetchProperties]);

  useEffect(() => {
    const onReady = () => void refetchProperties();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetchProperties]);

  const nameById = useMemo(() => {
    const m = new Map<PropertyId, string>();
    for (const p of properties) m.set(p.id, p.name);
    return m;
  }, [properties]);

  const resolvePropertyName = useCallback(
    (id: PropertyId) => {
      if (id === "all") return "Todas las propiedades";
      return nameById.get(id) ?? id;
    },
    [nameById]
  );

  return (
    <PropertyContext.Provider
      value={{
        selectedProperty,
        setSelectedProperty,
        properties,
        loading,
        refetchProperties,
        resolvePropertyName,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}
