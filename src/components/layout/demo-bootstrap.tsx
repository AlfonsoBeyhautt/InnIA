"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/hooks/use-session";

/**
 * Seeds demo operational data for new authenticated accounts (once per session).
 */
export function DemoBootstrap() {
  const { user, loading } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    if (loading || !user || ran.current) return;
    ran.current = true;

    void fetch("/api/demo/bootstrap", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return;
        await res.json();
        window.dispatchEvent(new CustomEvent("innia:data-ready"));
      })
      .catch(() => {
        ran.current = false;
      });
  }, [user, loading]);

  return null;
}
