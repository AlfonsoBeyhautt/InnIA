"use client";

import type { SuggestedAutoReply } from "@/types";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function SuggestedAutoReplyCard({
  item,
  onCreate,
  created,
}: {
  item: SuggestedAutoReply;
  onCreate?: () => void;
  created?: boolean;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-sm">{item.question}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.preview}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {item.sourceCount} consultas similares
        </span>
        <Button
          size="sm"
          variant={created ? "secondary" : "outline"}
          disabled={created}
          onClick={onCreate}
        >
          {created ? "Creada" : "Crear respuesta automática"}
        </Button>
      </div>
    </article>
  );
}
