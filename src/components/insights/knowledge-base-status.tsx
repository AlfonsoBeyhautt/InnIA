import Link from "next/link";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import type { KnowledgeBaseItem, KnowledgeStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  KnowledgeStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  completo: { label: "Completo", icon: CheckCircle2, className: "text-success" },
  incompleto: { label: "Incompleto", icon: Circle, className: "text-warning" },
  faltante: { label: "Faltante", icon: AlertCircle, className: "text-danger" },
};

export function KnowledgeBaseStatus({ items }: { items: KnowledgeBaseItem[] }) {
  return (
    <section className="ci-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Base de conocimiento IA</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Qué sabe la IA y qué información falta cargar
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/propiedades">Completar información faltante</Link>
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3"
            >
              <span className="text-sm font-medium">{item.topic}</span>
              <span className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.className)}>
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
