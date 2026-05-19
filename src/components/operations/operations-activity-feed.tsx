"use client";

import { motion } from "framer-motion";
import { Bot, SprayCan, Wrench } from "lucide-react";
import { operationsActivityFeed } from "@/data/mock/operations";
import { cn } from "@/lib/utils";

const iconMap = {
  limpieza: { icon: SprayCan, className: "bg-sand text-primary" },
  mantenimiento: { icon: Wrench, className: "bg-amber-50 text-amber-800" },
  ia: { icon: Bot, className: "bg-primary/10 text-primary" },
};

export function OperationsActivityFeed() {
  return (
    <section className="ci-warm-panel p-5">
      <h2 className="ci-section-title text-base">Actividad operativa</h2>
      <p className="ci-section-sub">Últimas actualizaciones del equipo y la IA</p>
      <ul className="mt-4 space-y-3">
        {operationsActivityFeed.map((item, i) => {
          const cfg = iconMap[item.type];
          const Icon = cfg.icon;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 rounded-xl border border-primary/8 bg-card px-3 py-2.5"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  cfg.className
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
