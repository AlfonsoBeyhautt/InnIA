"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SidebarContextValue = {
  /** Icon-only rail when true and not hovered */
  collapsed: boolean;
  /** Sidebar shows full labels */
  expanded: boolean;
  setHovered: (hovered: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHoveredSafe = useCallback((value: boolean) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (value) {
      setHovered(true);
      return;
    }
    leaveTimer.current = setTimeout(() => setHovered(false), 120);
  }, []);

  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    []
  );

  const expanded = !collapsed || hovered;

  return (
    <SidebarContext.Provider
      value={{ collapsed, expanded, setHovered: setHoveredSafe }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
