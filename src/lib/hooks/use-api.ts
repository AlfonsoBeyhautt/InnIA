"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseApiOptions = {
  /** When false, skips fetch and polling. Defaults to true. */
  enabled?: boolean;
  /** Called once when the API returns 401. No further retries until url changes. */
  onUnauthorized?: () => void;
};

type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  unauthorized: boolean;
  refetch: () => Promise<void>;
};

export function useApi<T>(
  url: string | null,
  fallback?: T,
  options?: UseApiOptions
): UseApiState<T> {
  const enabled = options?.enabled !== false && Boolean(url);
  const onUnauthorized = options?.onUnauthorized;

  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const blockedRef = useRef(false);

  const [data, setData] = useState<T | null>(fallback ?? null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const refetch = useCallback(async () => {
    if (!url || !enabled || blockedRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url);

      if (res.status === 401) {
        blockedRef.current = true;
        setUnauthorized(true);
        setData(fallbackRef.current ?? null);
        onUnauthorizedRef.current?.();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : `Error ${res.status}`
        );
      }

      const json = await res.json();
      setData(json);
      setUnauthorized(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de red";
      setError(msg);
      if (fallbackRef.current !== undefined) {
        setData(fallbackRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    blockedRef.current = false;
    setUnauthorized(false);

    if (!enabled) {
      setLoading(false);
      return;
    }

    refetch();
  }, [url, enabled, refetch]);

  return { data, loading, error, unauthorized, refetch };
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (res.status === 401) {
    const err = new Error(
      typeof json.error === "string" ? json.error : "No autorizado"
    );
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : `Error ${res.status}`);
  }
  return json as T;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<T>(res);
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<T>(res);
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  return parseJsonResponse<T>(res);
}
