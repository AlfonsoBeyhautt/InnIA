"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResultGroup } from "@/lib/db/search";

type SearchResponse = {
  query: string;
  groups: SearchResultGroup[];
};

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Error de búsqueda");
      const data = (await res.json()) as SearchResponse;
      setGroups(data.groups ?? []);
    } catch {
      setError("No se pudo completar la búsqueda.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  useEffect(() => {
    const onReady = () => {
      if (query.trim().length >= 2) void runSearch(query);
    };
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [query, runSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults = groups.some((g) => g.items.length > 0);
  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Buscar huéspedes, reservas, propiedades..."
        className="h-9 w-full rounded-xl border border-border/70 bg-card/70 pl-9 pr-3 text-sm shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary/35 focus:bg-card focus:ring-2 focus:ring-primary/10"
        aria-autocomplete="list"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(420px,70vh)] overflow-y-auto rounded-2xl border border-border/75 bg-card/98 py-2 shadow-[0_20px_52px_-26px_rgba(46,58,42,0.45),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && error && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{error}</p>
          )}

          {!loading && !error && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {!loading &&
            !error &&
            groups.map((group) => (
              <div key={group.type} className="px-2 py-1">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${group.type}-${item.id}`}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="block rounded-xl px-3 py-2 transition-colors hover:bg-sand/80"
                      >
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.subtitle && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
